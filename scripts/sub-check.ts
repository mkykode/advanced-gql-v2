/**
 * Verifies subscriptions end-to-end without a browser.
 *
 * Chrome blocks the hosted Apollo Sandbox (a public https origin) from reaching
 * localhost via its Local Network Access check, which makes Sandbox an awkward
 * way to test subscriptions locally. This script talks to the server directly.
 *
 * Usage: node scripts/sub-check.ts   (with the server already running)
 */
import {createClient} from 'graphql-ws/client'
import WebSocket from 'ws'

const HTTP = 'http://localhost:4000/graphql'
const WS = 'ws://localhost:4000/graphql'

/** Only the slices of the response this script reads. */
interface GraphQLResponse {
  data?: {
    signup?: {token?: string}
    createPost?: {message?: string}
    newPost?: {message: string; author: {email: string}}
  }
  errors?: unknown
}

const post = (query: string, token?: string): Promise<GraphQLResponse> =>
  fetch(HTTP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {authorization: token} : {})
    },
    body: JSON.stringify({query})
  }).then(r => r.json() as Promise<GraphQLResponse>)

const email = `sub-check-${Date.now()}@test.local`

const signup = await post(
  `mutation { signup(input:{email:"${email}",password:"p",role:ADMIN}) { token } }`
)
const token = signup.data?.signup?.token
if (!token) {
  console.error('signup failed:', JSON.stringify(signup.errors))
  process.exit(1)
}
console.log('1. signed up over HTTP')

const client = createClient({
  url: WS,
  webSocketImpl: WebSocket,
  connectionParams: {authorization: token}
})

const received: GraphQLResponse[] = []
const gotEvent = new Promise<void>(resolve => {
  client.subscribe<GraphQLResponse['data']>(
    {query: 'subscription { newPost { message author { email } } }'},
    {
      next: d => {
        received.push(d as GraphQLResponse)
        resolve()
      },
      error: e => {
        console.error(
          'subscription error:',
          e instanceof Error ? e.message : JSON.stringify(e)
        )
        resolve()
      },
      complete: () => resolve()
    }
  )
})

await new Promise(r => setTimeout(r, 700))
console.log('2. subscribed over WebSocket')

const created = await post(
  'mutation { createPost(input:{message:"hello from sub-check"}) { message } }',
  token
)
console.log(
  '3. published:',
  created.data?.createPost?.message ?? JSON.stringify(created.errors)
)

await Promise.race([gotEvent, new Promise<void>(r => setTimeout(r, 3000))])
await client.dispose()

const first = received[0]
if (first) {
  console.log(
    '4. received over WebSocket:',
    JSON.stringify(first.data?.newPost)
  )
  console.log('\n✅ subscriptions working')
  process.exit(0)
}
console.log('\n❌ no event received')
process.exit(1)
