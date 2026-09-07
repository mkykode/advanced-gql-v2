import {ApolloServer} from '@apollo/server'
import {startStandaloneServer} from '@apollo/server/standalone'
import {GraphQLError} from 'graphql'
import gql from 'graphql-tag'

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    createdAt: Int!
  }

  type Settings {
    user: User!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }

  input NewsSettingsInput {
    user: ID!
    theme: String
  }
  type Mutation {
    settings(input: NewsSettingsInput!): Settings!
  }
`

const resolvers = {
  Query: {
    me() {
      return {
        id: 'oiuoij',
        username: 'test',
        createdAt: 2343435
      }
    },
    settings(_, {user}) {
      return {
        user,
        theme: 'light'
      }
    }
  },
  Mutation: {
    settings(_, {input}, ctx) {
      return input
    }
  },

  Settings: {
    user() {
      return {
        id: 1,
        username: 'test',
        createdAt: 2343435
      }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

const {url} = await startStandaloneServer(server, {
  async context() {}
})
console.log(`🚀 Server ready at ${url}`)
