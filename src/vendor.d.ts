/**
 * Hand-written declarations for two dependencies that predate bundled types.
 *
 * `@types/lowdb` is a deprecated stub containing no declarations — it says
 * "lowdb provides its own type definitions", which is true of lowdb 3+ but not
 * of the 1.0.0 this project pins. `nanoid` 2.x likewise ships none.
 *
 * These cover only the surface src/db actually uses. Deliberately narrow: the
 * goal is to type our own code, not to redescribe lodash's chain API.
 */

declare module 'lowdb' {
  /** A lodash-style chain. Every method returns a chain until .value()/.write(). */
  export interface LowdbChain<T> {
    find(filter?: Partial<T>): LowdbChain<T>
    filter(filter?: Partial<T>): LowdbChain<T>
    orderBy(keys: string[], orders: string[]): LowdbChain<T>
    assign(update: Partial<T>): LowdbChain<T>
    push(...items: T[]): LowdbChain<T>
    remove(filter: Partial<T>): LowdbChain<T>
    head(): LowdbChain<T>
    /** Unwraps the chain. Returns undefined when nothing matched. */
    value(): any
    /** Unwraps and persists to the adapter. */
    write(): any
  }

  export interface LowdbInstance {
    get<T>(table: string): LowdbChain<T>
    defaults(defaults: Record<string, unknown>): LowdbInstance
  }

  export default function low(adapter: unknown): LowdbInstance
}

declare module 'lowdb/adapters/FileSync.js' {
  export default class FileSync {
    constructor(source: string, options?: Record<string, unknown>)
  }
}

declare module 'nanoid' {
  /** nanoid 2.x default-exports the generator directly. */
  export default function nanoid(size?: number): string
}
