/**
 * Is there an N+1 in this schema? Count the model calls.
 * Run: node scratch-nplus1.mjs
 */
import {makeExecutableSchema} from '@graphql-tools/schema'
import DataLoader from 'dataloader'
import {graphql} from 'graphql'
import resolvers from './src/resolvers.ts'
import typeDefs from './src/typedefs.ts'

const schema = makeExecutableSchema({typeDefs, resolvers})

// 6 posts, but only 2 distinct authors
const USERS = [
  {
    id: 'u1',
    email: 'a@a.com',
    avatar: 'x',
    verified: true,
    role: 'ADMIN',
    createdAt: 1571213104370
  },
  {
    id: 'u2',
    email: 'b@b.com',
    avatar: 'x',
    verified: true,
    role: 'MEMBER',
    createdAt: 1571213104370
  }
]
const POSTS = Array.from({length: 6}, (_, i) => ({
  id: `p${i}`,
  message: `post ${i}`,
  author: i % 2 === 0 ? 'u1' : 'u2',
  createdAt: 1571213304370,
  likes: i,
  views: i * 10
}))

const QUERY = '{ feed { id author { id email } } }'

// ---------- A. what the code does today ----------
let naiveCalls = 0
const naiveModels = {
  Post: {findMany: () => POSTS},
  User: {
    findOne: ({id}) => {
      naiveCalls++
      return USERS.find(u => u.id === id)
    }
  },
  Settings: {findOne: () => undefined}
}

await graphql({
  schema,
  source: QUERY,
  contextValue: {
    models: naiveModels,
    user: null,
    db: null,
    createToken: () => ''
  }
})

// ---------- B. the same resolvers, with a DataLoader in front ----------
let batchedLoads = 0
let batchCalls = 0
const makeLoaders = () => ({
  user: new DataLoader(async ids => {
    batchCalls++
    batchedLoads += ids.length
    // one lookup for the whole batch, results returned in the order asked
    return ids.map(id => USERS.find(u => u.id === id))
  })
})

const loaders = makeLoaders()
const batchedModels = {
  ...naiveModels,
  User: {findOne: ({id}) => loaders.user.load(id)}
}

await graphql({
  schema,
  source: QUERY,
  contextValue: {
    models: batchedModels,
    user: null,
    db: null,
    createToken: () => ''
  }
})

console.log(
  `posts: ${POSTS.length}, distinct authors: ${new Set(POSTS.map(p => p.author)).size}\n`
)
console.log(
  `A. today          User.findOne called ${naiveCalls} times   <- N+1`
)
console.log(
  `B. with DataLoader batch fn called ${batchCalls} time, for ${batchedLoads} keys`
)
console.log(
  `   (DataLoader also de-duplicates: ${new Set(POSTS.map(p => p.author)).size} unique ids requested)`
)
process.exit(0)
