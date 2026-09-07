import type {GraphQLResolveInfo} from 'graphql'
import {describe, expect, test} from 'vitest'
import resolvers from '../src/resolvers.ts'
import type {Context} from '../src/types.ts'

describe('resovers', () => {
  test('feed', () => {
    // feed only touches models.Post.findMany, so the rest of Context is
    // irrelevant here. Cast rather than build a full fake.
    const ctx = {
      models: {
        Post: {
          findMany() {
            return ['hello']
          }
        }
      }
    } as unknown as Context

    // Resolvers types every field as `Resolver`, a union of a plain function
    // and a { resolve } object, and marks it optional — so narrow before use.
    const feed = resolvers.Query?.feed
    if (typeof feed !== 'function') {
      throw new Error('expected Query.feed to be a resolver function')
    }

    const result = feed({}, {}, ctx, {} as GraphQLResolveInfo)

    expect(result).toEqual(['hello'])
  })
})
