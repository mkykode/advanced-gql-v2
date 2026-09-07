// v4+ removed SchemaDirectiveVisitor. Schema directives are now applied by
// transforming the schema with mapSchema + getDirective from graphql-tools.
//
// The shape changed fundamentally: instead of a class the server instantiates
// and calls visitFieldDefinition() on, you write a function that walks the
// finished schema and returns a *new* schema with wrapped resolvers.
import {getDirective, MapperKind, mapSchema} from '@graphql-tools/utils'
import type {GraphQLFieldConfig, GraphQLSchema} from 'graphql'
import {defaultFieldResolver} from 'graphql'

/**
 * @log — logs every call to the field it decorates.
 *
 * Usage in the SDL:
 *   type Query { feed: [Post]! @log }
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
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0]
      // returning undefined leaves the field untouched
      if (!directive) return undefined

      // fields with no explicit resolver still have behaviour — read the
      // property off the parent — so fall back to defaultFieldResolver rather
      // than assuming fieldConfig.resolve exists
      const {resolve = defaultFieldResolver} = fieldConfig

      return {
        ...fieldConfig,
        resolve(source, args, context, info) {
          console.log(`[log] ${typeName}.${fieldName}`)
          return resolve(source, args, context, info)
        }
      }
    }
  })
