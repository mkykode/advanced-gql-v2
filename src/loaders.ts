import DataLoader from 'dataloader'
import type {Models, Settings, User} from './types.ts'

/**
 * Per-request batching for the field resolvers.
 *
 * GraphQL calls a field resolver once per parent object, so `{ feed { author } }`
 * over 6 posts calls Post.author 6 times — the N+1 problem. DataLoader collects
 * every .load() made in the same tick, de-duplicates the keys, and issues one
 * bulk lookup.
 *
 * Against lowdb this buys nothing measurable: the "database" is a synchronous
 * in-memory array. It is here because the shape is what matters — swap in
 * Postgres or a REST API and those 6 calls become 6 round trips per request.
 */
export interface Loaders {
  user: DataLoader<string, User | undefined>
  settings: DataLoader<string, Settings | undefined>
}

/**
 * MUST be called per request, from the context function — never once at module
 * scope.
 *
 * DataLoader caches every key it has seen for the lifetime of the instance. A
 * shared loader would serve one user's row to the next request and would never
 * observe a write, so the cache has to die with the request that created it.
 */
export const createLoaders = (models: Models): Loaders => ({
  user: new DataLoader(async ids => models.User.findManyByIds(ids)),
  settings: new DataLoader(async ids => models.Settings.findManyByIds(ids))
})
