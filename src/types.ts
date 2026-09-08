/**
 * Shared domain and context types.
 *
 * These describe the *database* shapes, which are not the same as the GraphQL
 * shapes in typedefs.js. A stored Post holds `author` as a user id string; the
 * GraphQL `Post.author` field resolves that id into a full User. Keeping the
 * two apart is what makes the field resolvers in resolvers.ts meaningful.
 */

export type Role = 'ADMIN' | 'MEMBER' | 'GUEST'
export type Theme = 'DARK' | 'LIGHT'

export interface User {
  id: string
  email: string
  password: string
  avatar: string
  verified: boolean
  role: Role
  createdAt: number
  /** id of this user's Settings row */
  settings?: string
}

export interface Post {
  id: string
  message: string
  /** user id, resolved to a User by Post.author */
  author: string
  createdAt: number
  likes: number
  views: number
}

export interface Settings {
  id: string
  /** user id */
  user: string
  theme: Theme
  emailNotifications: boolean
  pushNotifications: boolean
  createdAt: number
}

/**
 * Never persisted — built inline by the invite mutation. Still needs a shape
 * so codegen knows `from` is a user id that Invite.from resolves into a User.
 */
export interface Invite {
  email: string
  /** user id */
  from: string
  createdAt: string
  role: Role
}

/**
 * The persistence interface the resolvers depend on.
 *
 * Deliberately describes behaviour rather than lowdb: resolvers only need
 * these six methods, so the storage engine stays swappable and the data layer
 * can be typed independently.
 */
export interface Model<T> {
  findOne(filter?: Partial<T>): T | undefined
  findMany(filter?: Partial<T>): T[]
  /** undefined when the filter matched nothing */
  updateOne(filter: Partial<T>, update: Partial<T>): T | undefined
  remove(filter: Partial<T>): unknown
  createOne(fields: Partial<T>): T
  createMany(toCreate: Partial<T> | Partial<T>[]): unknown
}

export interface Models {
  User: Model<User>
  Post: Model<Post>
  Settings: Model<Settings>
}

/** Third argument to every resolver. Built in src/index.js per request. */
export interface Context {
  models: Models
  db: unknown
  /** null when the request carries no valid token */
  user: User | null
  createToken(user: Pick<User, 'id' | 'role'>): string
}
