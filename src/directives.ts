// v4+ removed SchemaDirectiveVisitor. Schema directives are now applied by
// transforming the schema with mapSchema + getDirective from graphql-tools.
//
// The shape changed fundamentally: instead of a class the server instantiates
// and calls visitFieldDefinition() on, you write a function that walks the
// finished schema and returns a *new* schema with wrapped resolvers.
import {getDirective, MapperKind, mapSchema} from '@graphql-tools/utils'
import type {GraphQLFieldConfig, GraphQLSchema} from 'graphql'
import {defaultFieldResolver, GraphQLString} from 'graphql'

/** Arguments declared on the directive itself, not on the field it decorates. */
interface LogDirectiveArgs {
  message?: string
}

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
