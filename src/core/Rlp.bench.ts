import { bench, describe } from 'vitest'
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

const encodedSmall = Rlp.encode(small)
const encodedFlat = Rlp.encode(flatList)
const encodedNested = Rlp.encode(nestedList)
const encodedMedium = Rlp.encode(medium)

const encodedSmallHex = Rlp.encode(small, { as: 'Hex' })
const encodedFlatHex = Rlp.encode(flatList, { as: 'Hex' })

describe('Rlp.encode (Bytes input)', () => {
  bench('single 32-byte string', () => {
    Rlp.encode(small)
  })
  bench('single 256-byte string', () => {
    Rlp.encode(medium)
  })
  bench('single 4096-byte string', () => {
    Rlp.encode(large)
  })
  bench('flat list of 5x 32-byte strings', () => {
    Rlp.encode(flatList)
  })
  bench('nested list', () => {
    Rlp.encode(nestedList)
  })
})

describe('Rlp.decode (Bytes input)', () => {
  bench('single 32-byte string', () => {
    Rlp.decode(encodedSmall, { as: 'Bytes' })
  })
  bench('single 256-byte string', () => {
    Rlp.decode(encodedMedium, { as: 'Bytes' })
  })
  bench('flat list of 5x 32-byte strings', () => {
    Rlp.decode(encodedFlat, { as: 'Bytes' })
  })
  bench('nested list', () => {
    Rlp.decode(encodedNested, { as: 'Bytes' })
  })
})

describe('Rlp.encode (Hex input)', () => {
  const smallHex = Hex.fromBytes(small)
  bench('single 32-byte string', () => {
    Rlp.encode(smallHex, { as: 'Hex' })
  })
})

describe('Rlp.decode (Hex input)', () => {
  bench('single 32-byte string', () => {
    Rlp.decode(encodedSmallHex, { as: 'Hex' })
  })
  bench('flat list of 5x 32-byte strings', () => {
    Rlp.decode(encodedFlatHex, { as: 'Hex' })
  })
})
