/**
 * Ordering two transforms that fight over the same value.
 * Run: node scratch-order.mjs
 */
import {makeExecutableSchema} from '@graphql-tools/schema'
import {getDirective, MapperKind, mapSchema} from '@graphql-tools/utils'
import {defaultFieldResolver, graphql} from 'graphql'

const typeDefs = `#graphql
  directive @upper on FIELD_DEFINITION
  directive @lower on FIELD_DEFINITION

  enum Case { UPPER, LOWER }
  directive @case(to: Case!) on FIELD_DEFINITION

  type Query {
    both: String @upper @lower
    viaEnum: String @case(to: UPPER)
  }
`

const resolvers = {
  Query: {both: () => 'MiXeD cAsE', viaEnum: () => 'MiXeD cAsE'}
}

// a transform that maps the resolved string
const caseTransformer = (name, fn) => schema =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: fieldConfig => {
      if (!getDirective(schema, fieldConfig, name)?.[0]) return undefined
      const {resolve = defaultFieldResolver} = fieldConfig
      return {
        ...fieldConfig,
        async resolve(...a) {
          const v = await resolve(...a)
          return typeof v === 'string' ? fn(v) : v
        }
      }
    }
  })

const upper = caseTransformer('upper', s => s.toUpperCase())
const lower = caseTransformer('lower', s => s.toLowerCase())

// the single-directive alternative: conflict is impossible by construction
const caseEnum = schema =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: fieldConfig => {
      const d = getDirective(schema, fieldConfig, 'case')?.[0]
      if (!d) return undefined
      const {resolve = defaultFieldResolver} = fieldConfig
      return {
        ...fieldConfig,
        async resolve(...a) {
          const v = await resolve(...a)
          if (typeof v !== 'string') return v
          return d.to === 'UPPER' ? v.toUpperCase() : v.toLowerCase()
        }
      }
    }
  })

const run = async (label, build) => {
  const schema = build(makeExecutableSchema({typeDefs, resolvers}))
  const r = await graphql({schema, source: '{ both viaEnum }'})
  console.log(
    `${label.padEnd(34)} both=${JSON.stringify(r.data.both)}  viaEnum=${JSON.stringify(r.data.viaEnum)}`
  )
}

console.log(
  'resolver returns "MiXeD cAsE"; the field carries BOTH @upper and @lower\n'
)
await run('upper(lower(schema))', s => caseEnum(upper(lower(s))))
await run('lower(upper(schema))', s => caseEnum(lower(upper(s))))
