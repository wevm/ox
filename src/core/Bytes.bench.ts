import { bench, describe } from 'vitest'
import * as Bytes from './Bytes.js'

const u32 = 2_147_483_647n
const u256 = (1n << 256n) - 1n
const bytes32 = (() => {
  const b = new Uint8Array(32)
  for (let i = 0; i < 32; i++) b[i] = (i * 7 + 11) & 0xff
  return b
})()
const bytes32Zero = new Uint8Array(32)

describe('Bytes.fromNumber({ size: 32 })', () => {
  bench('bigint, max', () => {
    Bytes.fromNumber(u256, { size: 32 })
  })

  bench('bigint, small', () => {
    Bytes.fromNumber(420n, { size: 32 })
  })

  bench('number', () => {
    Bytes.fromNumber(420, { size: 32 })
  })

  bench('bigint, max u32', () => {
    Bytes.fromNumber(u32, { size: 32 })
  })
})

describe('Bytes.toBigInt', () => {
  bench('32 bytes', () => {
    Bytes.toBigInt(bytes32)
  })

  bench('32 bytes (zero)', () => {
    Bytes.toBigInt(bytes32Zero)
  })

  bench('32 bytes, size: 32', () => {
    Bytes.toBigInt(bytes32, { size: 32 })
  })
})
