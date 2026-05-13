import { bench, describe } from 'vitest'
import * as Hex from './Hex.js'

const small = new Uint8Array(32).map((_, i) => i)
const medium = new Uint8Array(256).map((_, i) => i & 0xff)
const large = new Uint8Array(4096).map((_, i) => i & 0xff)

const smallHex = Hex.fromBytes(small)
const mediumHex = Hex.fromBytes(medium)
const largeHex = Hex.fromBytes(large)

describe('Hex.fromBytes', () => {
  bench('32 bytes', () => {
    Hex.fromBytes(small)
  })
  bench('256 bytes', () => {
    Hex.fromBytes(medium)
  })
  bench('4096 bytes', () => {
    Hex.fromBytes(large)
  })
})

describe('Hex.toBytes', () => {
  bench('32 bytes', () => {
    Hex.toBytes(smallHex)
  })
  bench('256 bytes', () => {
    Hex.toBytes(mediumHex)
  })
  bench('4096 bytes', () => {
    Hex.toBytes(largeHex)
  })
})

describe('Hex.concat', () => {
  bench('two small', () => {
    Hex.concat(smallHex, smallHex)
  })
  bench('eight small', () => {
    Hex.concat(
      smallHex,
      smallHex,
      smallHex,
      smallHex,
      smallHex,
      smallHex,
      smallHex,
      smallHex,
    )
  })
})

describe('Hex.fromNumber', () => {
  bench('small number (no size)', () => {
    Hex.fromNumber(420)
  })
  bench('safe-int fast path (size 32)', () => {
    Hex.fromNumber(420, { size: 32 })
  })
  bench('bigint (size 32)', () => {
    Hex.fromNumber(0xdeadbeefcafe1234n, { size: 32 })
  })
})

describe('Hex.toBigInt', () => {
  bench('32 bytes', () => {
    Hex.toBigInt(smallHex)
  })
})

describe('Hex.padLeft', () => {
  bench('32 -> 32 (noop)', () => {
    Hex.padLeft(smallHex, 32)
  })
  bench('1 -> 32', () => {
    Hex.padLeft(Hex.fromBytes(small.subarray(0, 1)), 32)
  })
})

describe('Hex.fromString', () => {
  bench('short ASCII', () => {
    Hex.fromString('Hello world!')
  })
})

describe('Hex.validate (strict)', () => {
  bench('256 bytes', () => {
    Hex.validate(mediumHex, { strict: true })
  })
})
