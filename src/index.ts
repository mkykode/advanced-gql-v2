import {createServer} from 'node:http'
import {ApolloServer} from '@apollo/server'
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer'
// v5 removed @apollo/server/express4 — Express integration is its own package now
import {expressMiddleware} from '@as-integrations/express5'
import {makeExecutableSchema} from '@graphql-tools/schema'
import cors from 'cors'
import express from 'express'
// graphql-ws v6 path is 'graphql-ws/use/ws' (v5 was 'graphql-ws/lib/use/ws')
import {useServer} from 'graphql-ws/use/ws'
import {WebSocketServer} from 'ws'
import {createToken, getUserFromToken} from './auth.ts'
import {db, models} from './db/index.ts'
import {
  authDirectiveTransformer,
  formatDirectiveTransformer,
  logDirectiveTransformer
} from './directives.ts'
import {graphiqlHtml} from './graphiql.ts'
import resolvers from './resolvers.ts'
import typeDefs from './typedefs.ts'

// graphql-ws needs a real GraphQLSchema object, so we build it up front
// instead of letting ApolloServer do it from typeDefs + resolvers.
//
// Directives are applied here, as a transform over the finished schema. v4+
// has no `schemaDirectives` option — the schema you hand to ApolloServer is
// already the transformed one, so both transports get the behaviour.
//
// Applied in array order: auth first (innermost at runtime), formatDate last
// (outermost) so it formats the finished value.
const schema = [
  authDirectiveTransformer,
  logDirectiveTransformer,
  formatDirectiveTransformer
].reduce(
  (s, transform) => transform(s),
  makeExecutableSchema({typeDefs, resolvers})
)

const app = express()
const httpServer = createServer(app)

// --- WebSocket transport (subscriptions) ---
const wsServer = new WebSocketServer({server: httpServer, path: '/graphql'})

const serverCleanup = useServer(
  {
    schema,
    // Replaces AS2's `subscriptions.onConnect`. WebSockets have no headers,
    // so the client sends auth in connectionParams instead.
    context: async ctx => {
      // connectionParams is `Record<string, unknown> | undefined` — the client
      // controls its contents, so narrow rather than trust it.
      const raw = ctx.connectionParams?.authorization
      const token = typeof raw === 'string' ? raw : undefined
      const user = getUserFromToken(token)
      return {db, models, user, createToken}
    }
  },
  wsServer
)

// --- HTTP transport (queries + mutations) ---
const server = new ApolloServer({
  schema,
  plugins: [
    // Drain in-flight HTTP requests on shutdown...
    ApolloServerPluginDrainHttpServer({httpServer}),
    // ...and close open WebSocket connections too.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          }
        }
      }
    }
  ]
})

// expressMiddleware requires an already-started server
await server.start()

app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server, {
    async context({req}) {
      const token = req.headers.authorization
      const user = getUserFromToken(token)
      return {db, models, user, createToken}
    }
  })
)

// A local IDE. Apollo's hosted Sandbox can't reach localhost over WebSocket
// because Chrome blocks public origins from the local network; this one is
// served from our own origin, so subscriptions work.
app.get('/graphiql', (_req, res) => res.type('html').send(graphiqlHtml))

httpServer.listen(4000, () => {
  console.log('🚀 Queries/mutations: http://localhost:4000/graphql')
  console.log('🔌 Subscriptions:     ws://localhost:4000/graphql')
  console.log('🛝 Local IDE:         http://localhost:4000/graphiql')
})
