/**
 * What ApolloServerPluginCacheControl actually produces.
 * Run: node scratch-cachecontrol.mjs
 */
import {ApolloServer} from '@apollo/server'
import {ApolloServerPluginCacheControl} from '@apollo/server/plugin/cacheControl'
import {startStandaloneServer} from '@apollo/server/standalone'

const typeDefs = `#graphql
  # not built in — you declare it yourself in v4/v5
  enum CacheControlScope { PUBLIC PRIVATE }
  directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
    inheritMaxAge: Boolean
  ) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

  type Post @cacheControl(maxAge: 300) {
    id: ID!
    title: String!
  }

  type Query {
    # cacheable for 5 minutes
    posts: [Post!]! @cacheControl(maxAge: 300)
    # cacheable for 30s
    trending: [Post!]! @cacheControl(maxAge: 30)
    # per-user: must never hit a shared cache
    me: String! @cacheControl(maxAge: 60, scope: PRIVATE)
    # no hint at all
    uncached: String!
    # hint set imperatively in the resolver instead of the SDL
    dynamic: String!
  }
`

const posts = [{id: '1', title: 'hello'}]
const resolvers = {
  Query: {
    posts: () => posts,
    trending: () => posts,
    me: () => 'jull',
    uncached: () => 'no hint',
    dynamic: (_p, _a, _c, info) => {
      // the imperative equivalent of the directive
      info.cacheControl.setCacheHint({maxAge: 45, scope: 'PUBLIC'})
      return 'hinted at runtime'
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginCacheControl({
      // fields with no hint default to 0 (uncacheable) unless you raise this
      defaultMaxAge: 0
    })
  ]
})

const {url} = await startStandaloneServer(server, {listen: {port: 4811}})

const q = async (label, query) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query})
  })
  const body = await r.json()
  console.log(
    `${label.padEnd(40)} Cache-Control: ${r.headers.get('cache-control') ?? '(none)'}`
  )
  if (body.errors) console.log('   ERROR', body.errors[0].message)
}

await q('{ posts { id } }                  300s', '{ posts { id title } }')
await q('{ trending { id } }                30s', '{ trending { id title } }')
await q('both → minimum wins?', '{ posts { id } trending { id } }')
await q('{ me }  PRIVATE', '{ me }')
await q('{ uncached }  no hint', '{ uncached }')
await q('{ dynamic }  setCacheHint()', '{ dynamic }')
await q('cacheable + uncacheable together', '{ posts { id } uncached }')

process.exit(0)
