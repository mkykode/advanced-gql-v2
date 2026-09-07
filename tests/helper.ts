import {ApolloServer} from '@apollo/server'
import {addMocksToSchema} from '@graphql-tools/mock'
import {makeExecutableSchema} from '@graphql-tools/schema'
import type {DocumentNode} from 'graphql'
import resolvers from '../src/resolvers.ts'
import typeDefs from '../src/typedefs.ts'

/**
 * Tests supply partial mocks (just the models a given resolver touches), so
 * this is deliberately looser than the real Context.
 */
export type TestContext = Record<string, unknown>

interface OperationRequest {
  query: DocumentNode | string
  variables?: Record<string, unknown>
  operationName?: string
}

const createTestServer = (ctx: TestContext) => {
  // v4 removed the `mocks` / `mockEntireSchema` constructor options. Mocking is
  // now a schema transform from @graphql-tools/mock. `preserveResolvers: true`
  // is the old `mockEntireSchema: false`: real resolvers win, mocks fill gaps.
  const schema = addMocksToSchema({
    schema: makeExecutableSchema({typeDefs, resolvers}),
    preserveResolvers: true
  })

  const server = new ApolloServer<TestContext>({schema})

  // v4 removed apollo-server-testing's createTestClient. You call
  // server.executeOperation() directly, and context is passed per operation
  // as `contextValue` rather than baked into the constructor.
  const execute = async (request: OperationRequest) => {
    const res = await server.executeOperation(request, {contextValue: ctx})

    // body is a union — incremental delivery (@defer/@stream) returns a
    // different shape. Narrowing here keeps the union out of every test.
    if (res.body.kind !== 'single') {
      throw new Error(`expected a single result, got "${res.body.kind}"`)
    }
    return res.body.singleResult
  }

  return {query: execute, mutate: execute, server}
}

export default createTestServer
