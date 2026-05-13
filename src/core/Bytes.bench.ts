import { bench, describe } from 'vitest'
import * as Bytes from './Bytes.js'

const small = new Uint8Array(32).map((_, i) => i)
const medium = new Uint8Array(256).map((_, i) => i & 0xff)
const large = new Uint8Array(4096).map((_, i) => i & 0xff)

const smallHex = Bytes.toHex(small)
const mediumHex = Bytes.toHex(medium)
const largeHex = Bytes.toHex(large)

const smallString = 'Hello world!'
const mediumString = 'lorem ipsum '.repeat(32)
const helloBytes = Bytes.fromString('hello world')

describe('Bytes.fromHex', () => {
  bench('32 bytes', () => {
    Bytes.fromHex(smallHex)
  })
  bench('256 bytes', () => {
    Bytes.fromHex(mediumHex)
  })
  bench('4096 bytes', () => {
    Bytes.fromHex(largeHex)
  })
})

describe('Bytes.toHex', () => {
  bench('32 bytes', () => {
    Bytes.toHex(small)
  })
  bench('256 bytes', () => {
    Bytes.toHex(medium)
  })
  bench('4096 bytes', () => {
    Bytes.toHex(large)
  })
})

describe('Bytes.concat', () => {
  bench('two small', () => {
    Bytes.concat(small, small)
  })
  bench('eight small', () => {
    Bytes.concat(small, small, small, small, small, small, small, small)
  })
})

describe('Bytes.fromString', () => {
  bench('short ASCII', () => {
    Bytes.fromString(smallString)
  })
  bench('medium ASCII', () => {
    Bytes.fromString(mediumString)
  })
})

describe('Bytes.toString', () => {
  bench('short ASCII', () => {
    Bytes.toString(helloBytes)
  })
})

describe('Bytes.fromNumber', () => {
  bench('small (size 32)', () => {
    Bytes.fromNumber(420, { size: 32 })
  })
  bench('large bigint (size 32)', () => {
    Bytes.fromNumber(0xdeadbeefcafe1234n, { size: 32 })
  })
})

describe('Bytes.padLeft', () => {
  bench('32 -> 32 (noop)', () => {
    Bytes.padLeft(small, 32)
  })
  bench('1 -> 32', () => {
    Bytes.padLeft(small.subarray(0, 1), 32)
  })
})
