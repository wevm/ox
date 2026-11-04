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
      // Signed decode, fuzzed directly over odd-length hex strings rather
      // than round-tripped through `fromNumber` — a round trip through
      // `fromNumber` (unsigned-minimal-width encoding) is ambiguous
      // whenever a positive value's own top bit lands on its own byte
      // boundary (e.g. `2^47`), independent of and unrelated to hex-length
      // parity, so it isn't a suitable oracle here.
      //
      // Generates a magnitude in `[16^(n-1), 16^n - 1]` (n = odd nibble
      // count) so `magnitude.toString(16)` always renders as EXACTLY n
      // digits — `toString(16)` doesn't zero-pad, so a magnitude below that
      // floor would silently render shorter (and possibly even-length),
      // defeating the odd-length case entirely. The expected value is
      // computed by an independent two's-complement implementation against
      // the hex string's own actual length (matching what the real
      // implementation is meant to do), not assumed from `n` — a fractional
      // `(hex.length - 2) / 2` byte-width computation previously threw a
      // `RangeError` on every one of these odd-length inputs.
      nibbles: fc.integer({ min: 0, max: 30 }).map((n) => n * 2 + 1), // odd values in [1, 61]
    },
    { numRuns },
  )(
    'toBigInt(oddLengthHex, { signed: true }) matches an independent two’s-complement decode',
    ({ nibbles }) => {
      fc.assert(
        fc.property(
          fc.bigInt({
            min: nibbles === 1 ? 0n : 16n ** BigInt(nibbles - 1),
            max: 16n ** BigInt(nibbles) - 1n,
          }),
          (magnitude) => {
            const hexDigits = magnitude.toString(16)
            expect(hexDigits.length).toBe(nibbles) // sanity: guards the fuzz generator itself
            const hex = `0x${hexDigits}` as Hex.Hex

            const byteWidth = Math.ceil(nibbles / 2)
            const maxUnsigned = (1n << (BigInt(byteWidth) * 8n)) - 1n
            const maxSigned = maxUnsigned >> 1n
            const expected =
              magnitude <= maxSigned ? magnitude : magnitude - maxUnsigned - 1n

            expect(Hex.toBigInt(hex, { signed: true })).toEqual(expected)
          },
        ),
        { numRuns: 20 },
      )
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
