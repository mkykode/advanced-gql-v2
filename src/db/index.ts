import low from 'lowdb'
// CJS deps with no "exports" map need the full file path under ESM
import FileSync from 'lowdb/adapters/FileSync.js'
import type {Models} from '../types.ts'
import createModel from './models.ts'

const adapter = new FileSync('src/db/db.json')
const db = low(adapter)

db.defaults({posts: [], users: [], settings: []})

const models: Models = {
  Settings: createModel(db, 'settings'),
  Post: createModel(db, 'posts'),
  User: createModel(db, 'users')
}

export {models, db}
export default {models, db}
