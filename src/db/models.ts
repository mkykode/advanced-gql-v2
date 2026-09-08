import type {LowdbInstance} from 'lowdb'
import nano from 'nanoid'
import type {Model} from '../types.ts'

/**
 * Wraps a lowdb table in the Model<T> interface the resolvers depend on.
 *
 * Resolvers import Model<T> from types.ts and never touch lowdb directly, so
 * swapping the storage engine is a change to this file alone.
 */
const createModel = <T extends {id: string; createdAt: number}>(
  db: LowdbInstance,
  table: string
): Model<T> => ({
  findOne(filter: Partial<T> = {}) {
    if (!filter) {
      db.get<T>(table).head().value()
    }

    return db.get<T>(table).find(filter).value()
  },
  findMany(filter?: Partial<T>) {
    if (!filter) {
      return db.get<T>(table).orderBy(['createdAt'], ['desc']).value()
    }

    return db
      .get<T>(table)
      .filter(filter)
      .orderBy(['createdAt'], ['desc'])
      .value()
  },
  updateOne(filter: Partial<T>, update: Partial<T>) {
    const match = db.get<T>(table).find(filter).value()

    // nothing matched — report the miss rather than reading .id off undefined,
    // which surfaced as an opaque INTERNAL_SERVER_ERROR
    if (!match) return undefined

    db.get<T>(table).find(filter).assign(update).write()

    return db
      .get<T>(table)
      .find({id: match.id} as Partial<T>)
      .value()
  },
  remove(filter: Partial<T>) {
    return db.get<T>(table).remove(filter).write()
  },
  createOne(fields: Partial<T>) {
    const item = {...fields, createdAt: Date.now(), id: nano()} as T
    db.get<T>(table).push(item).write()

    return db
      .get<T>(table)
      .find({id: item.id} as Partial<T>)
      .value()
  },
  createMany(toCreate: Partial<T> | Partial<T>[]) {
    const manyToCreate = (Array.isArray(toCreate) ? toCreate : [toCreate]).map(
      item => ({...item, createdAt: Date.now(), id: nano()}) as T
    )

    return db
      .get<T>(table)
      .push(...manyToCreate)
      .write()
  }
})

export default createModel
