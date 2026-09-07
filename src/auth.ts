import type {GraphQLResolveInfo} from 'graphql'
import {GraphQLError} from 'graphql'
import jwt from 'jsonwebtoken'
import {models} from './db/index.ts'
import {ErrorCode} from './errors.ts'
import type {AuthedContext, Context, Role, User} from './types.ts'

const secret = 'catpack'

/**
 * takes a user object and creates  jwt out of it
 * using user.id and user.role
 */
export const createToken = ({id, role}: Pick<User, 'id' | 'role'>): string =>
  jwt.sign({id, role}, secret)

/**
 * will attemp to verify a jwt and find a user in the
 * db associated with it. Catches any error and returns
 * a null user
 */
export const getUserFromToken = (token: string | undefined): User | null => {
  try {
    const payload = jwt.verify(token as string, secret) as {id: string}
    return models.User.findOne({id: payload.id}) ?? null
  } catch {
    return null
  }
}

/** Any resolver, parameterised by the context it requires. */
type Resolver<TContext, TRoot = unknown, TArgs = any, TReturn = unknown> = (
  root: TRoot,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TReturn

/**
 * checks if the user is on the context object
 * continues to the next resolver if true
 *
 * Takes a resolver needing AuthedContext and returns one accepting the plain
 * Context — so the guarantee "user is non-null" is expressed in the types, not
 * just in the comment.
 */
export const authenticated =
  <TRoot, TArgs, TReturn>(
    next: Resolver<AuthedContext, TRoot, TArgs, TReturn>
  ): Resolver<Context, TRoot, TArgs, TReturn> =>
  (root, args, context, info) => {
    const {user} = context
    if (!user) {
      throw new GraphQLError('not authorized', {
        extensions: {code: ErrorCode.UNAUTHENTICATED}
      })
    }
    return next(root, args, {...context, user}, info)
  }

/**
 * checks if the user on the context has the specified role.
 * continues to the next resolver if true
 *
 * Requires AuthedContext on both sides: it reads user.role, so it must sit
 * *inside* authenticated(), never outside it.
 */
export const authorized =
  <TRoot, TArgs, TReturn>(
    role: Role,
    next: Resolver<AuthedContext, TRoot, TArgs, TReturn>
  ): Resolver<AuthedContext, TRoot, TArgs, TReturn> =>
  (root, args, context, info) => {
    if (context.user.role !== role) {
      throw new GraphQLError('not correct role', {
        extensions: {code: ErrorCode.FORBIDDEN}
      })
    }
    return next(root, args, context, info)
  }
