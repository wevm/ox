import { bench, describe } from 'vp/test'
import * as Hex from './Hex.js'
import * as Rlp from './Rlp.js'

const empty = new Uint8Array()
const small = new Uint8Array(32).map((_, i) => i)
const medium = new Uint8Array(256).map((_, i) => i & 0xff)
const large = new Uint8Array(4096).map((_, i) => i & 0xff)

const flatList = [empty, small, small, small, small]
const nestedList = [
  small,
  [small, small, small],
  [[small, small], [small]],
  medium,
]

const encodedSmall = Rlp.fromBytes(small)
const encodedFlat = Rlp.fromBytes(flatList)
const encodedNested = Rlp.fromBytes(nestedList)
const encodedMedium = Rlp.fromBytes(medium)

const encodedSmallHex = Rlp.fromBytes(small, { as: 'Hex' })
const encodedFlatHex = Rlp.fromBytes(flatList, { as: 'Hex' })

describe('Rlp.fromBytes (encode)', () => {
  bench('single 32-byte string', () => {
    Rlp.fromBytes(small)
  })
  bench('single 256-byte string', () => {
    Rlp.fromBytes(medium)
  })
  bench('single 4096-byte string', () => {
    Rlp.fromBytes(large)
  })
  bench('flat list of 5x 32-byte strings', () => {
    Rlp.fromBytes(flatList)
  })
  bench('nested list', () => {
    Rlp.fromBytes(nestedList)
  })
})

describe('Rlp.toBytes (decode)', () => {
  bench('single 32-byte string', () => {
    Rlp.toBytes(encodedSmall)
  })
  bench('single 256-byte string', () => {
    Rlp.toBytes(encodedMedium)
  })
  bench('flat list of 5x 32-byte strings', () => {
    Rlp.toBytes(encodedFlat)
  })
  bench('nested list', () => {
    Rlp.toBytes(encodedNested)
  })
})

describe('Rlp.fromHex (encode)', () => {
  const smallHex = Hex.fromBytes(small)
  bench('single 32-byte string', () => {
    Rlp.fromHex(smallHex)
  })
})

describe('Rlp.toHex (decode)', () => {
  bench('single 32-byte string', () => {
    Rlp.toHex(encodedSmallHex)
  })
  bench('flat list of 5x 32-byte strings', () => {
    Rlp.toHex(encodedFlatHex)
  })
})
