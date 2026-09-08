import {gql} from 'graphql-tag'

export default gql`
  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }
  directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
    inheritMaxAge: Boolean
  ) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION
  # The transformer adds a "message" argument to each decorated field, so a
  # client overrides it as a normal field arg: { feed(message: "...") { id } }
  directive @log(message: String = "error message") on FIELD_DEFINITION
  directive @formatDate(format: String = "dd MMM yyy") on FIELD_DEFINITION
  # requires is optional: bare @auth means "any logged-in user".
  # Roles are ranked GUEST < MEMBER < ADMIN, so requires: MEMBER admits ADMIN too.
  directive @auth(requires: Role) on FIELD_DEFINITION

  # An EXECUTABLE directive: the client writes it in the query, like @skip.
  # Truncating text for display is genuinely the caller's decision, which is
  # what makes FIELD the right location here.
  #   { feed { message @truncate(length: 10) } }
  directive @truncate(length: Int! = 20, ellipsis: String = "…") on FIELD

  enum Theme {
    DARK
    LIGHT
  }

  enum Role {
    ADMIN
    MEMBER
    GUEST
  }

  type User {
    id: ID!
    email: String!
    avatar: String!
    verified: Boolean!
    createdAt: String! @formatDate
    posts: [Post]!
    role: Role!
    settings: Settings!
  }

  type AuthUser {
    token: String!
    user: User!
  }

  type Post {
    id: ID!
    message: String!
    author: User!
    createdAt: String! @formatDate
    likes: Int!
    views: Int!
  }

  type Settings {
    id: ID!
    user: User!
    theme: Theme!
    emailNotifications: Boolean!
    pushNotifications: Boolean!
  }

  type Invite {
    email: String!
    from: User!
    createdAt: String!
    role: Role!
  }

  input NewPostInput {
    message: String!
  }

  input UpdateSettingsInput {
    theme: Theme
    emailNotifications: Boolean
    pushNotifications: Boolean
  }

  input UpdateUserInput {
    email: String
    avatar: String
    verified: Boolean
  }

  input InviteInput {
    email: String!
    role: Role!
  }

  input SignupInput {
    email: String!
    password: String!
    role: Role!
  }

  input SigninInput {
    email: String!
    password: String!
  }

  type Query {
    me: User! @auth(requires: MEMBER) @cacheControl(maxAge: 60)
    posts: [Post]! @auth(requires: MEMBER)
    post(id: ID!): Post! @auth @log(message: "fetching a post")
    userSettings: Settings! @auth(requires: MEMBER)
    feed: [Post]!
      @cacheControl(maxAge: 60)
      @log(message: "🚨 someone read the feed")
  }

  type Mutation {
    updateSettings(input: UpdateSettingsInput!): Settings! @auth
    createPost(input: NewPostInput!): Post! @auth(requires: MEMBER)
    updateMe(input: UpdateUserInput!): User @auth(requires: MEMBER)
    invite(input: InviteInput!): Invite! @auth(requires: ADMIN)
    signup(input: SignupInput!): AuthUser!
    signin(input: SigninInput!): AuthUser!
  }

  type Item {
    task: String!
  }

  type Subscription {
    newPost: Post!
  }
`
