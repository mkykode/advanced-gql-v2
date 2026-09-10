/**
 * Demo: reading an `on FIELD` (executable) directive that the CLIENT writes.
 *
 * mapSchema cannot see it — it runs at build time, before any query exists.
 * You read it per request inside resolve(), off `info`.
 *
 * Run: node scratch-executable-directive.mjs
 */
import {ApolloServer} from '@apollo/server'
import {startStandaloneServer} from '@apollo/server/standalone'
import {makeExecutableSchema} from '@graphql-tools/schema'
import {MapperKind, mapSchema} from '@graphql-tools/utils'
import {defaultFieldResolver, getDirectiveValues} from 'graphql'

const typeDefs = `#graphql
  directive @auth(role: String = "MEMBER") on FIELD

  type Query {
    secret: String
    open: String
  }
`

const resolvers = {
  Query: {
    secret: () => 'the secret',
    open: () => 'anyone can see this'
  }
}

/**
 * Because the client decides which fields carry @auth, we cannot know at build
 * time which to wrap — so we wrap EVERY field and check per call. That cost is
 * inherent to executable directives.
 */
const executableAuthTransformer = schema =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
      const {resolve = defaultFieldResolver} = fieldConfig

      return {
        ...fieldConfig,
        resolve(source, args, context, info) {
          // the directive DEFINITION lives on the schema...
          const def = info.schema.getDirective('auth')

          // ...and the client's USAGE lives on the query's AST node.
          // info.fieldNodes is an array: the same field can appear more than
          // once via aliases or fragments, each with its own directives.
          const usages = info.fieldNodes.map(node =>
            def ? getDirectiveValues(def, node, info.variableValues) : undefined
          )
          const directive = usages.find(Boolean)

          if (directive) {
            console.log(
              `  ${typeName}.${fieldName} → @auth present, role=${JSON.stringify(directive.role)}`
            )
          } else {
            console.log(`  ${typeName}.${fieldName} → no @auth in the query`)
          }

          return resolve(source, args, context, info)
        }
      }
    }
  })

const server = new ApolloServer({
  schema: executableAuthTransformer(makeExecutableSchema({typeDefs, resolvers}))
})
const {url} = await startStandaloneServer(server, {listen: {port: 4788}})

const q = async (query, variables) => {
  console.log(
    `\n--- ${query}${variables ? `  vars=${JSON.stringify(variables)}` : ''}`
  )
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables})
  })
  const j = await r.json()
  if (j.errors) console.log('  ERROR:', j.errors[0].message)
}

await q('{ open }')
await q('{ open @auth }')
await q('{ secret @auth(role: "ADMIN") }')
await q('query ($r: String) { secret @auth(role: $r) }', {r: 'FROM_A_VARIABLE'})
await q('{ a: secret @auth(role: "ALIAS_A") b: secret }')

process.exit(0)
