import {GraphQLError} from 'graphql'
import jwt from 'jsonwebtoken'
import {models} from './db/index.ts'
import {ErrorCode} from './errors.ts'
import type {Context, User} from './types.ts'

const secret = 'catpack'

/**
 * takes a user object and creates  jwt out of it
 * using user.id and user.role
 */
export const createToken = ({id, role}: Pick<User, 'id' | 'role'>): string =>
  jwt.sign({id, role}, secret)

/**
 * will attemp to verify a jwt and find a user in the
 * db associated with it. Catches any error and returns
 * a null user
 */
export const getUserFromToken = (token: string | undefined): User | null => {
  try {
    const payload = jwt.verify(token as string, secret) as {id: string}
    return models.User.findOne({id: payload.id}) ?? null
  } catch {
    return null
  }
}

/**
 * Narrows context.user from `User | null` to `User`.
 *
 * Enforcement lives in the @auth schema directive, which throws before any
 * decorated resolver runs. TypeScript cannot see that, so resolvers behind
 * @auth call this to get a checked non-null user rather than asserting one.
 * It throws the same error, so a field that forgets @auth still fails safely
 * instead of dereferencing null.
 */
export const requireUser = (context: Context): User => {
  if (!context.user) {
    throw new GraphQLError('not authenticated', {
      extensions: {code: ErrorCode.UNAUTHENTICATED}
    })
  }
  return context.user
}
