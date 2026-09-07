import {gql} from 'graphql-tag'
import {describe, expect, test} from 'vitest'
import createTestServer from './helper.ts'

const CREATE_POST = gql`
  mutation CreatePost {
    createPost(input: {message: "hello"}) {
      message
    }
  }
`

describe('mutation', () => {
  test('feed', async () => {
    const {mutate} = createTestServer({
      user: {id: 1},
      models: {
        Post: {
          createOne() {
            return {
              message: 'hello'
            }
          }
        }
      }
    })

    const res = await mutate({query: CREATE_POST})

    // snapshots pass on first run whatever they capture — assert success
    // explicitly so a broken request can't sit here looking green
    expect(res.errors).toBeUndefined()
    expect(res).toMatchSnapshot()
  })
})
