import {ApolloServerErrorCode} from '@apollo/server/errors'

/**
 * Every error code this API can return.
 *
 * Codes are part of the public contract: clients branch on them, so renaming
 * one is a breaking change. Referencing them from here instead of writing
 * string literals at each throw site means a typo is a compile error.
 *
 * This is a const object rather than a TS `enum` on purpose. Node runs .ts
 * files by *stripping* types, and `enum` emits runtime code, so it cannot be
 * stripped — `node file.ts` fails to parse it. `as const` plus a derived
 * union is the erasable equivalent.
 *
 * Spreads in Apollo's built-in codes (BAD_USER_INPUT, INTERNAL_SERVER_ERROR,
 * ...) so there is a single place to import from. UNAUTHENTICATED and
 * FORBIDDEN are not Apollo built-ins — they're the conventional names Apollo's
 * docs recommend for auth failures.
 */
export const ErrorCode = {
  ...ApolloServerErrorCode,
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN'
} as const

/** Union of every valid code string, e.g. 'UNAUTHENTICATED' | 'BAD_USER_INPUT' | ... */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
