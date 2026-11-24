import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { Bytes, Hex } from 'ox'
import * as viem from 'viem'
import { describe, expect } from 'vitest'
import { arbitraryHex } from '../../../test/fuzz/arbitraries/bytes.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

describe('Hex padding', () => {
  test.prop(
    {
      hex: arbitraryHex(40),
      size: fc.option(fc.integer({ min: 0, max: 48 }), { nil: undefined }),
      dir: fc.constantFrom('left', 'right') as fc.Arbitrary<'left' | 'right'>,
    },
    { numRuns },
  )('padLeft and padRight pad as viem does', ({ hex, size, dir }) => {
    const pad = dir === 'left' ? Hex.padLeft : Hex.padRight
    const bytesPad = dir === 'left' ? Bytes.padLeft : Bytes.padRight
    // Size 0 leaves the value as it is.
    if (size === 0) {
      expect(pad(hex, 0)).toBe(hex)
      return
    }
    const target = size ?? 32
    if (Hex.size(hex) > target) {
      expect(() => pad(hex, size)).toThrow()
      expect(() => viem.pad(hex, { dir, size: target })).toThrow()
      return
    }
    const padded = pad(hex, size)
    expect(padded).toBe(viem.pad(hex, { dir, size: target }))
    expect(bytesPad(Bytes.fromHex(hex), size)).toEqual(Bytes.fromHex(padded))
  })

  test.prop(
    {
      bytes: fc.uint8Array({ maxLength: 40 }),
      extra: fc.integer({ min: 0, max: 40 }),
    },
    { numRuns },
  )('sized encoders pad on the right to the size', ({ bytes, extra }) => {
    const size = bytes.length + extra
    const hex = Hex.fromBytes(bytes, { size })
    expect(hex).toBe(Hex.padRight(Hex.fromBytes(bytes), size))
    expect(Hex.size(hex)).toBe(size)
    expect(() => Hex.fromBytes(bytes, { size: bytes.length - 1 })).toThrow()
  })
})

describe('Hex.fromNumber', () => {
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
      return fc.record({
        size: fc.constant(size),
        signed: fc.constant(signed),
        value: fc.oneof(
          fc.bigInt({ min, max }),
          fc.constantFrom(min, max, 0n, ...(signed ? [-1n] : [1n])),
        ),
      })
    })

  test.prop({ input: sizedNumber }, { numRuns })(
    'encodes as viem (and ethers, unsigned) does; a safe integer as a number like its bigint',
    ({ input: { value, size, signed } }) => {
      // `size` may be undefined at runtime; the types ask for it with `signed`.
      const options = { size, signed } as { size: number; signed: boolean }
      const hex = Hex.fromNumber(value, options)
      expect(hex).toBe(viem.numberToHex(value, options))
      if (!signed && size !== undefined)
        expect(hex).toBe(ethers.toBeHex(value, size))
      expect(Hex.toBigInt(hex, options)).toBe(value)
      if (
        value >= BigInt(Number.MIN_SAFE_INTEGER) &&
        value <= BigInt(Number.MAX_SAFE_INTEGER)
      ) {
        expect(Hex.fromNumber(Number(value), options)).toBe(hex)
        expect(Hex.toNumber(hex, options)).toBe(Number(value))
      }
    },
  )
})
