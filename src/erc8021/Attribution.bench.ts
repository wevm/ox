import { bench, describe } from 'vitest'
import * as Attribution from './Attribution.js'

const schema0Data =
  '0xdddddddd62617365617070070080218021802180218021802180218021' as const

const schema1Data =
  '0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702c6d6f7270686f0e0180218021802180218021802180218021' as const

const schema2Data =
  '0xdddddddda161616762617365617070000b0280218021802180218021802180218021' as const

describe('Attribution.fromData', () => {
  bench('schema 0 (canonical registry)', () => {
    Attribution.fromData(schema0Data)
  })

  bench('schema 1 (custom registry)', () => {
    Attribution.fromData(schema1Data)
  })

  bench('schema 2 (CBOR-encoded)', () => {
    Attribution.fromData(schema2Data)
  })
})
