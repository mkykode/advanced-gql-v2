/**
 * What you CAN and CANNOT do with custom executable directives.
 * Run: node scratch-limits.mjs
 */
import {ApolloServer} from '@apollo/server'
import {startStandaloneServer} from '@apollo/server/standalone'
import {makeExecutableSchema} from '@graphql-tools/schema'
import {MapperKind, mapSchema} from '@graphql-tools/utils'
import {defaultFieldResolver, getDirectiveValues, GraphQLError} from 'graphql'

const typeDefs = `#graphql
  directive @upper on FIELD
  directive @deny on FIELD
  directive @tracked(name: String) on QUERY

  type Query {
    greeting: String
    other: String
  }
`

const resolvers = {
  Query: {greeting: () => 'hello world', other: () => 'other value'}
}

const transformer = schema =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: fieldConfig => {
      const {resolve = defaultFieldResolver} = fieldConfig
      return {
        ...fieldConfig,
        async resolve(source, args, context, info) {
          const read = name => {
            const def = info.schema.getDirective(name)
            return info.fieldNodes
              .map(n =>
                def
                  ? getDirectiveValues(def, n, info.variableValues)
                  : undefined
              )
              .find(Boolean)
          }

          // 1. can I THROW based on a client directive? yes
          if (read('deny')) {
            throw new GraphQLError('denied by @deny', {
              extensions: {code: 'FORBIDDEN'}
            })
          }

          const result = await resolve(source, args, context, info)

          // 2. can I TRANSFORM the result? yes
          if (read('upper') && typeof result === 'string') {
            return result.toUpperCase()
          }
          return result
        }
      }
    }
  })

const server = new ApolloServer({
  schema: transformer(makeExecutableSchema({typeDefs, resolvers})),
  plugins: [
    {
      // 3. can I read an `on QUERY` directive? yes — off the operation AST
      async requestDidStart() {
        return {
          async didResolveOperation({document, schema, request}) {
            const def = schema.getDirective('tracked')
            const op = document.definitions.find(
              d => d.kind === 'OperationDefinition'
            )
            const values = def
              ? getDirectiveValues(def, op, request.variables)
              : undefined
            if (values)
              console.log(
                '  @tracked on the operation →',
                JSON.stringify(values)
              )
          }
        }
      }
    }
  ]
})

const {url} = await startStandaloneServer(server, {listen: {port: 4799}})

const q = async query => {
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query})
  })
  const j = await r.json()
  console.log(`\n--- ${query}`)
  console.log('  response:', JSON.stringify(j))
}

await q('{ greeting }')
await q('{ greeting @upper }')
await q('{ greeting @deny }')
await q('query @tracked(name: "my-op") { greeting }')

console.log('\n=== the one real difference: @skip vs returning null ===')
await q('{ greeting @skip(if: true) other }')
await q('{ greeting @deny other }')

process.exit(0)
