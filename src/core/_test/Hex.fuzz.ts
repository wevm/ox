import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import { describe, expect } from 'vitest'

import {
  arbitraryBytes,
  arbitraryHex,
} from '../../../test/fuzz/arbitraries/bytes.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

describe('Hex round-trip', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b)) ≡ b',
    ({ bytes }) => {
      expect(Hex.toBytes(Hex.fromBytes(bytes))).toEqual(bytes)
    },
  )

  test.prop({ hex: arbitraryHex() }, { numRuns })(
    'fromBytes(toBytes(h)) ≡ h',
    ({ hex }) => {
      expect(Hex.fromBytes(Hex.toBytes(hex))).toEqual(hex.toLowerCase())
    },
  )

  test.prop({ value: fc.boolean() }, { numRuns })(
    'toBoolean(fromBoolean(v)) ≡ v',
    ({ value }) => {
      expect(Hex.toBoolean(Hex.fromBoolean(value))).toEqual(value)
    },
  )

  test.prop(
    {
      // ox `Hex.toString` UTF-8 round-trip; bound length to keep runs
      // bounded.
      value: fc.string({ maxLength: 256 }),
    },
    { numRuns },
  )('toString(fromString(s)) ≡ s', ({ value }) => {
    expect(Hex.toString(Hex.fromString(value))).toEqual(value)
  })

  test.prop(
    {
      // `toNumber` returns `number`, so cap the value to the safe
      // integer range. ox uses unsigned by default.
      value: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
    },
    { numRuns },
  )('toNumber(fromNumber(n)) ≡ n', ({ value }) => {
    expect(Hex.toNumber(Hex.fromNumber(value))).toEqual(value)
  })

  test.prop(
    {
      value: fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }),
    },
    { numRuns },
  )('toBigInt(fromNumber(big)) ≡ big', ({ value }) => {
    expect(Hex.toBigInt(Hex.fromNumber(value))).toEqual(value)
  })
})

describe('Hex.size', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'size(fromBytes(b)) ≡ b.length',
    ({ bytes }) => {
      expect(Hex.size(Hex.fromBytes(bytes))).toEqual(bytes.length)
    },
  )
})
