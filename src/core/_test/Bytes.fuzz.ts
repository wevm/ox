import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { Bytes, Hex } from 'ox'
import * as viem from 'viem'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

/** Strings of any UTF-16 code units, lone surrogates included. */
const anyString = fc.oneof(
  fc.string({ unit: 'grapheme', maxLength: 40 }),
  fc.string({ unit: 'binary', maxLength: 40 }),
  fc.string({
    unit: fc
      .integer({ min: 0, max: 0xffff })
      .map((code) => String.fromCharCode(code)),
    maxLength: 40,
  }),
)

/** A value that fits `size` bytes (signed or not), or any value without a size. */
const sizedNumber = fc
  .record({
    size: fc.option(fc.integer({ min: 1, max: 32 }), { nil: undefined }),
    signed: fc.boolean(),
  })
  .chain(({ size, signed: signed_ }) => {
    const signed = signed_ && size !== undefined
    const bits = BigInt((size ?? 32) * 8)
    const min = signed ? -(2n ** (bits - 1n)) : 0n
    const max = signed ? 2n ** (bits - 1n) - 1n : 2n ** bits - 1n
    const edges = [
      min,
      max,
      0n,
      1n,
      -1n,
      127n,
      128n,
      255n,
      256n,
      2n ** 53n - 1n,
    ]
    return fc.record({
      size: fc.constant(size),
      signed: fc.constant(signed),
      value: fc.oneof(
        fc.bigInt({ min, max }),
        fc.constantFrom(...edges.filter((x) => x >= min && x <= max)),
      ),
    })
  })

const isSafe = (value: bigint) =>
  value >= BigInt(Number.MIN_SAFE_INTEGER) &&
  value <= BigInt(Number.MAX_SAFE_INTEGER)

describe('Bytes UTF-8', () => {
  test.prop({ value: anyString }, { numRuns })(
    'fromString encodes as TextEncoder and ethers do; toString decodes back',
    ({ value }) => {
      const encoded = new TextEncoder().encode(value)
      expect(Bytes.fromString(value)).toEqual(encoded)
      expect(Hex.fromString(value)).toBe(Hex.fromBytes(encoded))
      try {
        expect(Bytes.fromString(value)).toEqual(ethers.toUtf8Bytes(value))
      } catch {} // ethers throws on lone surrogates; TextEncoder replaces them.
      const wellFormed =
        new TextDecoder('utf-8', { ignoreBOM: true }).decode(encoded) === value
      if (!wellFormed) return
      expect(Bytes.toString(encoded)).toBe(value)
      expect(Hex.toString(Hex.fromBytes(encoded))).toBe(value)
    },
  )

  test.prop({ bytes: fc.uint8Array({ maxLength: 100 }) }, { numRuns })(
    'toString decodes any bytes as TextDecoder does, short or long',
    ({ bytes }) => {
      const expected = new TextDecoder('utf-8', { ignoreBOM: true }).decode(
        bytes,
      )
      expect(Bytes.toString(bytes)).toBe(expected)
      expect(Hex.toString(Hex.fromBytes(bytes))).toBe(expected)
      // A view into a larger buffer decodes the same.
      const padded = new Uint8Array(bytes.length + 8)
      padded.set(bytes, 4)
      expect(Bytes.toString(padded.subarray(4, 4 + bytes.length))).toBe(
        expected,
      )
    },
  )

  test.prop(
    {
      value: fc.string({ unit: 'grapheme', minLength: 1, maxLength: 20 }),
      pad: fc.integer({ min: 0, max: 8 }),
    },
    { numRuns },
  )('a sized string pads with zeros and reads back', ({ value, pad }) => {
    // Trailing NULs are trimmed on the way back, as documented.
    if (/\0$/.test(value)) return
    const size = new TextEncoder().encode(value).length + pad
    const bytes = Bytes.fromString(value, { size })
    expect(bytes.length).toBe(size)
    expect(Bytes.toString(bytes, { size })).toBe(value)
    expect(Hex.fromString(value, { size })).toBe(Hex.fromBytes(bytes))
    expect(Hex.toString(Hex.fromBytes(bytes), { size })).toBe(value)
  })
})

describe('Bytes.fromHex', () => {
  test.prop(
    { bytes: fc.uint8Array({ maxLength: 100 }), upper: fc.boolean() },
    { numRuns },
  )('decodes hex as Buffer does, in any case', ({ bytes, upper }) => {
    const digits = Buffer.from(bytes).toString('hex')
    const hex = `0x${upper ? digits.toUpperCase() : digits}` as Hex.Hex
    expect(Bytes.fromHex(hex)).toEqual(new Uint8Array(bytes))
    expect(Bytes.fromHex(hex)).toEqual(ethers.getBytes(hex))
  })

  test.prop(
    {
      digits: fc.string({
        unit: fc.constantFrom(...'0123456789abcdefABCDEF'),
        minLength: 1,
        maxLength: 41,
      }),
    },
    { numRuns },
  )(
    'an odd number of digits reads with a leading zero nibble',
    ({ digits }) => {
      if (digits.length % 2 === 0) return
      expect(Bytes.fromHex(`0x${digits}`)).toEqual(
        Bytes.fromHex(`0x0${digits}`),
      )
    },
  )

  test.prop(
    {
      prefix: fc.constantFrom('0x', '0X', '', 'x', '00', ' 0x'),
      body: fc.string({
        unit: fc.constantFrom(
          ...'0123456789abcdefABCDEF',
          'g',
          'z',
          ' ',
          'x',
          '-',
          'é',
        ),
        maxLength: 12,
      }),
    },
    { numRuns },
  )('rejects anything that is not 0x-prefixed hex', ({ prefix, body }) => {
    const value = `${prefix}${body}`
    if (/^0x[0-9a-fA-F]*$/.test(value)) {
      expect(() => Bytes.fromHex(value as Hex.Hex)).not.toThrow()
      return
    }
    expect(() => Bytes.fromHex(value as Hex.Hex)).toThrow()
  })
})

describe('Bytes.fromNumber', () => {
  test.prop({ input: sizedNumber }, { numRuns })(
    'encodes as viem does, and a safe integer as a number like its bigint',
    ({ input: { value, size, signed } }) => {
      // `size` may be undefined at runtime; the types ask for it with `signed`.
      const options = { size, signed } as { size: number; signed: boolean }
      const bytes = Bytes.fromNumber(value, options)
      expect(bytes).toEqual(viem.numberToBytes(value, options))
      if (size !== undefined) expect(bytes.length).toBe(size)
      expect(Bytes.toBigInt(bytes, options)).toBe(value)
      if (!isSafe(value)) return
      expect(Bytes.fromNumber(Number(value), options)).toEqual(bytes)
      expect(Bytes.toNumber(bytes, options)).toBe(Number(value))
    },
  )

  test.prop(
    {
      size: fc.integer({ min: 1, max: 32 }),
      signed: fc.boolean(),
      over: fc.bigInt({ min: 0n, max: 2n ** 70n }),
      below: fc.boolean(),
    },
    { numRuns },
  )(
    'rejects values out of range for their size, as numbers and bigints',
    ({ size, signed, over, below }) => {
      const bits = BigInt(size * 8)
      const max = signed ? 2n ** (bits - 1n) - 1n : 2n ** bits - 1n
      const min = signed ? -(2n ** (bits - 1n)) : 0n
      const value = below ? min - 1n - over : max + 1n + over
      expect(() => Bytes.fromNumber(value, { size, signed })).toThrow()
      if (isSafe(value))
        expect(() =>
          Bytes.fromNumber(Number(value), { size, signed }),
        ).toThrow()
    },
  )

  test.prop(
    {
      value: fc.oneof(
        fc.double({ noInteger: true, noNaN: true }),
        fc.constantFrom(Number.NaN, Infinity, -Infinity),
      ),
      size: fc.option(fc.integer({ min: 1, max: 32 }), { nil: undefined }),
    },
    { numRuns },
  )('rejects numbers that are not integers', ({ value, size }) => {
    expect(() => Bytes.fromNumber(value, { size })).toThrow()
    expect(() => Hex.fromNumber(value, { size })).toThrow()
  })

  test.prop(
    {
      value: fc.oneof(
        fc.maxSafeInteger(),
        fc.bigInt({ min: -(2n ** 64n), max: 2n ** 64n }),
      ),
      size: fc.double({ min: 0.01, max: 32, noInteger: true, noNaN: true }),
    },
    { numRuns },
  )('rejects a fractional size', ({ value, size }) => {
    expect(() => Bytes.fromNumber(value, { size })).toThrow()
  })
})

describe('Bytes.isEqual', () => {
  const pair = fc.oneof(
    fc.tuple(
      fc.uint8Array({ maxLength: 40 }),
      fc.uint8Array({ maxLength: 40 }),
    ),
    // Equal, or one byte apart.
    fc
      .tuple(
        fc.uint8Array({ minLength: 1, maxLength: 40 }),
        fc.nat(),
        fc.integer({ min: 0, max: 255 }),
        fc.boolean(),
      )
      .map(([a, at, byte, change]) => {
        const b = new Uint8Array(a)
        if (change) b[at % b.length] = byte
        return [a, b] as const
      }),
  )
  test.prop({ pair }, { numRuns })(
    'compares bytes and hex (in any case) by value',
    ({ pair: [a, b] }) => {
      const equal = a.length === b.length && a.every((byte, i) => byte === b[i])
      expect(Bytes.isEqual(a, b)).toBe(equal)
      const hexA = Hex.fromBytes(a)
      const hexB = Hex.fromBytes(b)
      expect(Hex.isEqual(hexA, hexB)).toBe(equal)
      expect(
        Hex.isEqual(`0x${hexA.slice(2).toUpperCase()}` as Hex.Hex, hexB),
      ).toBe(equal)
    },
  )
})
