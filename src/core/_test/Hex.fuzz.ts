import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import { describe, expect } from 'vp/test'

import {
  arbitraryBytes,
  arbitraryHex,
} from '../../../test/fuzz/arbitraries/bytes.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

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
      // Odd nibble counts, fuzzed directly rather than round-tripped through
      // `fromNumber`: its minimal-width output makes a positive value with a
      // set top bit signed-decode as negative, so it is not an oracle here.
      // The magnitude floor keeps `toString(16)` at exactly `nibbles` digits.
      magnitude: fc
        .integer({ min: 0, max: 30 })
        .map((n) => n * 2 + 1)
        .chain((nibbles) =>
          fc.bigInt({
            min: nibbles === 1 ? 0n : 16n ** BigInt(nibbles - 1),
            max: 16n ** BigInt(nibbles) - 1n,
          }),
        ),
    },
    { numRuns },
  )(
    'toBigInt(oddLengthHex, { signed: true }) ≡ two’s-complement',
    ({ magnitude }) => {
      const hexDigits = magnitude.toString(16)
      expect(hexDigits.length % 2).toBe(1)
      const hex = `0x${hexDigits}` as Hex.Hex

      const maxUnsigned =
        (1n << (BigInt(Math.ceil(hexDigits.length / 2)) * 8n)) - 1n
      const maxSigned = maxUnsigned >> 1n
      const expected =
        magnitude <= maxSigned ? magnitude : magnitude - maxUnsigned - 1n

      expect(Hex.toBigInt(hex, { signed: true })).toEqual(expected)
    },
  )

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
