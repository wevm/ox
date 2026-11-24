import { fc, test } from '@fast-check/vitest'
import { Bytes, Hex } from 'ox'
import { numberToHex, stringToHex } from 'viem'
import { describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'

/** Sizes up to 8 bytes half the time, where safe integers take a path without BigInt. */
const arbitrarySize = fc.oneof(
  fc.integer({ max: 8, min: 1 }),
  fc.integer({ max: 32, min: 1 }),
)

/** An integer that fits its size, signed or not. */
const arbitrarySizedInteger = fc.oneof(
  arbitrarySize.chain((size) =>
    fc.record({
      signed: fc.constant(false),
      size: fc.constant(size),
      value: fc.bigInt({ max: 2n ** BigInt(size * 8) - 1n, min: 0n }),
    }),
  ),
  arbitrarySize.chain((size) =>
    fc.record({
      signed: fc.constant(true),
      size: fc.constant(size),
      value: fc.bigInt({
        max: 2n ** BigInt(size * 8 - 1) - 1n,
        min: -(2n ** BigInt(size * 8 - 1)),
      }),
    }),
  ),
)

describe('Bytes.fromNumber', () => {
  test.prop({ input: arbitrarySizedInteger }, { numRuns })(
    'matches viem and Hex.fromNumber, as a bigint and as a safe integer',
    ({ input: { signed, size, value } }) => {
      const options = { signed, size }
      const expected = numberToHex(value, options)
      const bytes = Bytes.fromNumber(value, options)
      expect(Hex.fromBytes(bytes)).toBe(expected)
      expect(Hex.fromNumber(value, options)).toBe(expected)
      expect(Bytes.toBigInt(bytes, options)).toBe(value)
      if (
        value < BigInt(Number.MIN_SAFE_INTEGER) ||
        value > BigInt(Number.MAX_SAFE_INTEGER)
      )
        return
      expect(Hex.fromBytes(Bytes.fromNumber(Number(value), options))).toBe(
        expected,
      )
      expect(Bytes.toNumber(bytes, options)).toBe(Number(value))
    },
  )

  test.prop(
    {
      value: fc.oneof(
        fc.maxSafeNat().map(BigInt),
        fc.bigInt({ max: 2n ** 600n, min: 0n }),
      ),
    },
    { numRuns },
  )('without a size, writes the fewest bytes', ({ value }) => {
    const digits = value.toString(16)
    const expected = `0x${digits.padStart(digits.length + (digits.length % 2), '0')}`
    expect(Hex.fromBytes(Bytes.fromNumber(value))).toBe(expected)
    if (value <= BigInt(Number.MAX_SAFE_INTEGER))
      expect(Hex.fromBytes(Bytes.fromNumber(Number(value)))).toBe(expected)
  })
})

describe('Bytes and Hex strings', () => {
  test.prop(
    {
      padded: fc.boolean(),
      value: fc.oneof(
        fc.string({ maxLength: 80, unit: 'grapheme' }),
        fc.string({ maxLength: 80, unit: 'binary' }),
      ),
    },
    { numRuns },
  )(
    'fromString matches viem, and toString round-trips it, with and without a size',
    ({ padded, value }) => {
      const length = new TextEncoder().encode(value).length
      const options = padded && length <= 32 ? { size: 32 } : {}
      const hex = Hex.fromString(value, options)
      expect(hex).toBe(stringToHex(value, options))
      expect(Hex.fromBytes(Bytes.fromString(value, options))).toBe(hex)
      // A string that ends in NUL is indistinguishable from padding once
      // padded.
      if (options.size && value.endsWith('\0')) return
      // A lone surrogate encodes as U+FFFD.
      const decoded = new TextDecoder().decode(new TextEncoder().encode(value))
      expect(Hex.toString(hex, options)).toBe(decoded)
      expect(Bytes.toString(Bytes.fromString(value, options), options)).toBe(
        decoded,
      )
    },
  )

  test.prop(
    {
      bytes: fc.oneof(
        fc.uint8Array({ maxLength: 80 }),
        // Lead and continuation bytes, so most inputs are malformed UTF-8.
        fc
          .array(fc.integer({ max: 0xff, min: 0x80 }), { maxLength: 80 })
          .map((values) => Uint8Array.from(values)),
      ),
    },
    { numRuns },
  )('toString decodes any bytes as TextDecoder does', ({ bytes }) => {
    const expected = new TextDecoder().decode(bytes)
    expect(Bytes.toString(bytes)).toBe(expected)
    expect(Hex.toString(Hex.fromBytes(bytes))).toBe(expected)
  })
})

describe('Bytes and Hex agree', () => {
  test.prop(
    {
      bytes: fc.uint8Array({ maxLength: 40 }),
      end: fc.integer({ max: 45, min: 0 }),
      other: fc.uint8Array({ maxLength: 10 }),
      size: fc.integer({ max: 48, min: 0 }),
      start: fc.integer({ max: 45, min: 0 }),
    },
    { numRuns },
  )(
    'on padding, trimming, slicing and concatenating',
    ({ bytes, end, other, size, start }) => {
      const hex = Hex.fromBytes(bytes)
      if (size >= bytes.length) {
        expect(Hex.padLeft(hex, size)).toBe(
          Hex.fromBytes(Bytes.padLeft(bytes, size)),
        )
        expect(Hex.padRight(hex, size)).toBe(
          Hex.fromBytes(Bytes.padRight(bytes, size)),
        )
        expect(Hex.padLeft(hex, size)).toHaveLength(2 + size * 2)
        expect(Hex.padRight(hex, size)).toHaveLength(2 + size * 2)
      }
      // Hex trims nibbles where Bytes trims bytes, so compare by value; either
      // can trim to `0x`.
      expect(BigInt(`0x0${Hex.trimLeft(hex).slice(2)}`)).toBe(
        BigInt(`0x0${Hex.fromBytes(Bytes.trimLeft(bytes)).slice(2)}`),
      )
      // A start at the end is out of bounds unless the value is empty.
      if (
        (start < bytes.length || start === 0) &&
        end <= bytes.length &&
        start <= end
      ) {
        expect(Hex.slice(hex, start, end)).toBe(
          Hex.fromBytes(bytes.slice(start, end)),
        )
        expect(Bytes.slice(bytes, start, end)).toEqual(bytes.slice(start, end))
      }
      const joined = Uint8Array.from([...bytes, ...other])
      expect(Hex.concat(hex, Hex.fromBytes(other))).toBe(Hex.fromBytes(joined))
      expect(Bytes.concat(bytes, other)).toEqual(joined)
    },
  )

  test.prop(
    {
      a: fc.uint8Array({ maxLength: 40 }),
      edit: fc.option(fc.tuple(fc.nat(), fc.nat(0xff), fc.boolean())),
      upper: fc.boolean(),
    },
    { numRuns },
  )(
    'isEqual is byte equality, and Hex.isEqual ignores case',
    ({ a, edit, upper }) => {
      // Half the pairs are equal; the others differ in one byte or in length.
      const b = Uint8Array.from(a)
      const other = (() => {
        if (!edit) return b
        const [at, byte, append] = edit
        if (append || b.length === 0) return Uint8Array.from([...b, byte])
        b[at % b.length] = byte
        return b
      })()
      const equal = Hex.fromBytes(a) === Hex.fromBytes(other)
      expect(Bytes.isEqual(a, other)).toBe(equal)
      const hex = Hex.fromBytes(other)
      expect(
        Hex.isEqual(
          Hex.fromBytes(a),
          (upper ? `0x${hex.slice(2).toUpperCase()}` : hex) as Hex.Hex,
        ),
      ).toBe(equal)
    },
  )
})
