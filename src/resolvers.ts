import {GraphQLError} from 'graphql'
import {PubSub} from 'graphql-subscriptions'
import {requireUser} from './auth.ts'
import {ErrorCode} from './errors.ts'
import type {
  MutationCreatePostArgs,
  MutationInviteArgs,
  MutationSigninArgs,
  MutationSignupArgs,
  MutationUpdateMeArgs,
  MutationUpdateSettingsArgs,
  QueryPostArgs,
  Resolvers
} from './generated/graphql.ts'
import type {Settings, User} from './types.ts'

const NEW_POST = 'NEW_POST'

// PubSub moved out of apollo-server into its own package in v4+.
// This one is in-memory / single-instance: fine for local dev, not production.
const pubsub = new PubSub()

/**
 * The schema declares these fields non-null, but models.findOne() returns
 * undefined when nothing matches. Fail with a real error rather than letting
 * GraphQL report the less useful "Cannot return null for non-nullable field".
 */
const orNotFound = <T>(value: T | undefined, what: string): T => {
  if (!value) {
    throw new GraphQLError(`${what} not found`, {
      extensions: {code: ErrorCode.BAD_USER_INPUT}
    })
  }
  return value
}

/**
 * Anything Query / Mutation resolver
 * using a user for a DB query
 * requires user authenication
 *
 * Typed as `Resolvers`, generated from typedefs.ts — a resolver that does not
 * match the schema is now a compile error.
 */
const resolvers: Resolvers = {
  Query: {
    // access control lives in the schema now: these fields carry @auth, which
    // throws before the resolver runs. requireUser() only re-narrows the type.
    me(_, __, context) {
      return requireUser(context)
    },
    posts(_, __, context) {
      return context.models.Post.findMany({author: requireUser(context).id})
    },
    post(_, {id}: QueryPostArgs, context) {
      const user = requireUser(context)
      return orNotFound(
        context.models.Post.findOne({id, author: user.id}),
        'post'
      )
    },
    userSettings(_, __, context) {
      const user = requireUser(context)
      return orNotFound(
        context.models.Settings.findOne({user: user.id}),
        'settings'
      )
    },
    // public resolver — no @auth
    feed(_, __, {models}) {
      return models.Post.findMany()
    }
  },
  Mutation: {
    updateSettings(_, {input}: MutationUpdateSettingsArgs, context) {
      const user = requireUser(context)
      return orNotFound(
        context.models.Settings.updateOne(
          {user: user.id},
          input as Partial<Settings>
        ),
        'settings'
      )
    },
    createPost(_, {input}: MutationCreatePostArgs, context) {
      const user = requireUser(context)
      const post = context.models.Post.createOne({...input, author: user.id})
      pubsub.publish(NEW_POST, {newPost: post})
      return post
    },

    updateMe(_, {input}: MutationUpdateMeArgs, context) {
      const user = requireUser(context)
      return orNotFound(
        context.models.User.updateOne({id: user.id}, input as Partial<User>),
        'user'
      )
    },
    // role check is declarative: @auth(requires: ADMIN) in the schema
    invite(_, {input}: MutationInviteArgs, context) {
      const user = requireUser(context)
      // `from` stays a user id here; Invite.from below resolves it to a User
      return {
        from: user.id,
        role: input.role,
        createdAt: String(Date.now()),
        email: input.email
      }
    },

    signup(_, {input}: MutationSignupArgs, {models, createToken}) {
      const existing = models.User.findOne({email: input.email})

      if (existing) {
        throw new GraphQLError('user already exists', {
          extensions: {
            code: ErrorCode.UNAUTHENTICATED
          }
        })
      }
      const user = models.User.createOne({
        ...input,
        verified: false,
        avatar: 'http'
      })
      const token = createToken(user)
      return {token, user}
    },
    signin(_, {input}: MutationSigninArgs, {models, createToken}) {
      const user = models.User.findOne(input)

      if (!user) {
        throw new GraphQLError('user does not exist', {
          extensions: {
            code: ErrorCode.UNAUTHENTICATED
          }
        })
      }

      const token = createToken(user)
      return {token, user}
    }
  },

  User: {
    posts(root, _, {user, models}) {
      // field resolvers carry no @auth, so user may be null here
      if (!user || root.id !== user.id) {
        throw new GraphQLError('not authorized', {
          extensions: {code: ErrorCode.UNAUTHENTICATED}
        })
      }

      return models.Post.findMany({author: root.id})
    },
    settings(root, __, {models}) {
      return orNotFound(
        models.Settings.findOne({id: root.settings, user: root.id}),
        'settings'
      )
    }
  },
  Settings: {
    // Settings.user is a User, not another Settings row — look it up by the
    // user id this settings row stores.
    user(settings, _, {models}) {
      return orNotFound(models.User.findOne({id: settings.user}), 'user')
    }
  },
  Post: {
    author(post, _, {models}) {
      return orNotFound(models.User.findOne({id: post.author}), 'author')
    }
  },
  Invite: {
    // `from` is stored as a user id; resolve it to the User the schema promises
    from(invite, _, {models}) {
      return orNotFound(models.User.findOne({id: invite.from}), 'user')
    }
  },

  Subscription: {
    newPost: {
      // graphql-subscriptions v3 renamed asyncIterator -> asyncIterableIterator
      subscribe: () => pubsub.asyncIterableIterator(NEW_POST)
    }
  }
}

export default resolvers
