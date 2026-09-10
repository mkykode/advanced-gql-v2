/**
 * Which resolvers need a DataLoader, and which don't.
 * Simulates a Postgres driver so every "query" is visible.
 *
 * Run: node scratch-loader-shapes.mjs
 */
import {makeExecutableSchema} from '@graphql-tools/schema'
import DataLoader from 'dataloader'
import {graphql} from 'graphql'

const USERS = Array.from({length: 4}, (_, i) => ({id: `u${i}`, email: `u${i}@x.com`}))
const POSTS = Array.from({length: 12}, (_, i) => ({
  id: `p${i}`,
  message: `post ${i}`,
  author: `u${i % 4}`
}))

let log = []
const sql = text => {
  log.push(text)
  return text
}

const typeDefs = `#graphql
  type User { id: ID!  email: String!  posts: [Post!]! }
  type Post { id: ID!  message: String!  author: User! }
  type Query { feed: [Post!]!  users: [User!]! }
`

// ---------- loaders ----------
const makeLoaders = () => ({
  // A. entity by id — the classic case
  userById: new DataLoader(async ids => {
    sql(`SELECT * FROM users WHERE id IN (${ids.join(', ')})`)
    const byId = new Map(USERS.map(u => [u.id, u]))
    return ids.map(id => byId.get(id))
  }),

  // B. one-to-many by foreign key — same N+1, DIFFERENT batch shape.
  //    The key is not a primary key, and each key maps to an ARRAY.
  postsByAuthor: new DataLoader(async authorIds => {
    sql(`SELECT * FROM posts WHERE author IN (${authorIds.join(', ')})`)
    const grouped = new Map(authorIds.map(id => [id, []]))
    for (const p of POSTS) if (grouped.has(p.author)) grouped.get(p.author).push(p)
    // still one entry per key, in order — but each entry is a list
    return authorIds.map(id => grouped.get(id))
  })
})

const resolvers = {
  Query: {
    // called ONCE per request — nothing to batch, no loader
    feed: () => {
      sql('SELECT * FROM posts ORDER BY created_at DESC')
      return POSTS
    },
    users: () => {
      sql('SELECT * FROM users')
      return USERS
    }
  },
  Post: {
    // called once per post → loader by id
    author: (post, _a, {loaders}) => loaders.userById.load(post.author)
  },
  User: {
    // called once per user → loader by foreign key
    posts: (user, _a, {loaders}) => loaders.postsByAuthor.load(user.id)
  }
}

const schema = makeExecutableSchema({typeDefs, resolvers})

const run = async (label, source) => {
  log = []
  const loaders = makeLoaders()
  const r = await graphql({schema, source, contextValue: {loaders}})
  if (r.errors) console.log('ERR', r.errors[0].message)
  console.log(`\n${label}`)
  console.log(`  queries issued: ${log.length}`)
  for (const q of log) console.log(`    ${q}`)
}

await run('{ feed { id } }                       (no relations)', '{ feed { id } }')
await run('{ feed { id author { email } } }      (12 posts, 4 authors)', '{ feed { id author { email } } }')
await run('{ users { email posts { id } } }      (4 users, one-to-many)', '{ users { email posts { id } } }')
await run('{ users { posts { author { email } } } }  (nested both ways)', '{ users { posts { author { email } } } }')

process.exit(0)
