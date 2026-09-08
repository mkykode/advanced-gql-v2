// v4+ removed SchemaDirectiveVisitor. Schema directives are now applied by
// transforming the schema with mapSchema + getDirective from graphql-tools.
//
// The shape changed fundamentally: instead of a class the server instantiates
// and calls visitFieldDefinition() on, you write a function that walks the
// finished schema and returns a *new* schema with wrapped resolvers.
import {getDirective, MapperKind, mapSchema} from '@graphql-tools/utils'
import type {GraphQLFieldConfig, GraphQLSchema} from 'graphql'
import {defaultFieldResolver, GraphQLError, GraphQLString} from 'graphql'
import {ErrorCode} from './errors.ts'
import type {Context, Role} from './types.ts'
import {formatDate} from './utils.ts'

/** Arguments declared on the directive itself, not on the field it decorates. */
interface LogDirectiveArgs {
  message?: string
}

interface FormatDateDirectiveArgs {
  format?: string
}

interface AuthDirectiveArgs {
  requires?: Role
}

/**
 * Roles are ranked, not disjoint: a higher rank satisfies a lower requirement.
 * So @auth(requires: MEMBER) admits ADMIN, and an admin is not locked out of
 * fields meant for ordinary members.
 */
const ROLE_RANK: Record<Role, number> = {GUEST: 0, MEMBER: 1, ADMIN: 2}

/**
 * @auth — requires a logged-in user. @auth(requires: ADMIN) also checks role.
 *
 * The declarative replacement for the authenticated()/authorized() wrappers:
 * the requirement now lives in the schema, next to the field it guards, and is
 * visible in introspection.
 *
 *   type Query    { me: User! @auth }
 *   type Mutation { invite(input: InviteInput!): Invite! @auth(requires: ADMIN) }
 *
 * FIELD_DEFINITION, never FIELD — a client could simply omit the latter.
 */
export const authDirectiveTransformer = (
  schema: GraphQLSchema,
  directiveName = 'auth'
): GraphQLSchema =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (
      fieldConfig: GraphQLFieldConfig<unknown, Context>
    ) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0] as
        | AuthDirectiveArgs
        | undefined

      // returning undefined leaves the field untouched
      if (!directive) return undefined

      const requiredRole = directive.requires
      const {resolve = defaultFieldResolver} = fieldConfig

      return {
        ...fieldConfig,
        resolve(source, args, context: Context, info) {
          if (!context.user) {
            throw new GraphQLError('not authenticated', {
              extensions: {
                code: ErrorCode.UNAUTHENTICATED
              }
            })
          }

          // authentication is checked first, so user is known to exist by the
          // time we read its role
          if (
            requiredRole &&
            ROLE_RANK[context.user.role] < ROLE_RANK[requiredRole]
          ) {
            throw new GraphQLError(
              `requires the ${requiredRole} role or higher`,
              {
                extensions: {
                  code: ErrorCode.FORBIDDEN
                }
              }
            )
          }

          // must RETURN — a wrapper that calls the resolver but discards its
          // value resolves the field to undefined
          return resolve(source, args, context, info)
        }
      }
    }
  })
/**
 * @formatDate(format: String) — formats the date the field resolves to, and
 * adds a `format` ARGUMENT so a client can choose its own format per query.
 *
 * In the SDL:
 *   type Post { createdAt: String! @formatDate }
 *
 * From a client:
 *   { feed { createdAt } }                      # "16 Oct 2019"
 *   { feed { createdAt(format: "yyyy") } }      # "2019"
 */
export const formatDirectiveTransformer = (
  schema: GraphQLSchema,
  directiveName = 'formatDate'
): GraphQLSchema =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (
      fieldConfig: GraphQLFieldConfig<unknown, unknown>
    ) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0] as
        | FormatDateDirectiveArgs
        | undefined

      // the directive already says which fields to transform — no need to
      // check the field name
      if (!directive) return undefined

      const defaultFormat = directive.format

      const {resolve = defaultFieldResolver} = fieldConfig

      return {
        ...fieldConfig,
        args: {
          ...fieldConfig.args,
          format: {type: GraphQLString, defaultValue: defaultFormat}
        },
        // async because resolve() may return a promise, and the value has to
        // exist before it can be formatted
        async resolve(source, args, context, info) {
          const {format = defaultFormat, ...rest} = args as Record<
            string,
            unknown
          > & {format?: string}

          // resolve FIRST, then format the result. `source` is the parent
          // object (the whole Post), not the date — formatting it throws
          // "Invalid time value".
          const value = await resolve(source, rest, context, info)
          if (value == null || !format) return value

          return formatDate(Number(value), format)
        }
      }
    }
  })

/**
 * @log(message: String) — logs every call to the field it decorates, and adds
 * a `message` ARGUMENT to that field so a client can override the text.
 *
 * In the SDL:
 *   type Query {
 *     feed: [Post]! @log(message: "someone read the feed")
 *   }
 *
 * The client then sees `feed` as if it were declared `feed(message: String)`,
 * and can pass its own value from Sandbox / GraphiQL:
 *   { feed(message: "from the playground") { id } }
 *
 * This is why the argument reaches the resolver's `args`: the directive put it
 * on the field. It is not the directive's own argument, which is only readable
 * at build time via getDirective().
 */
export const logDirectiveTransformer = (
  schema: GraphQLSchema,
  directiveName = 'log'
): GraphQLSchema =>
  mapSchema(schema, {
    // visit every field on every object type — the replacement for
    // visitFieldDefinition()
    [MapperKind.OBJECT_FIELD]: (
      fieldConfig: GraphQLFieldConfig<unknown, unknown>,
      fieldName,
      typeName
    ) => {
      // getDirective returns the directive's OWN arguments, with any SDL
      // default already applied. Read once, at build time.
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0] as
        | LogDirectiveArgs
        | undefined

      // returning undefined leaves the field untouched
      if (!directive) return undefined

      const defaultMessage = directive.message

      // fields with no explicit resolver still have behaviour — read the
      // property off the parent — so fall back to defaultFieldResolver rather
      // than assuming fieldConfig.resolve exists
      const {resolve = defaultFieldResolver} = fieldConfig

      return {
        ...fieldConfig,
        // add `message` to the field's arguments, defaulting to whatever the
        // SDL gave the directive. This is what makes it typeable in a query.
        args: {
          ...fieldConfig.args,
          message: {type: GraphQLString, defaultValue: defaultMessage}
        },
        resolve(source, args, context, info) {
          // strip `message` back out — the underlying resolver never declared
          // it and should not receive it
          const {message = defaultMessage, ...rest} = args as Record<
            string,
            unknown
          > & {message?: string}

          console.log(`[log] ${typeName}.${fieldName}: ${message}`)
          return resolve(source, rest, context, info)
        }
      }
    }
  })
