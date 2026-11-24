import { fc, test } from '@fast-check/vitest'
import { secp256k1 } from '@noble/curves/secp256k1'
import * as ethers from 'ethers'
import { Bytes, Hex, Signature } from 'ox'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const n = secp256k1.CURVE.n

const signature = fc.record({
  r: fc.oneof(
    fc.bigInt({ min: 1n, max: n - 1n }),
    fc.constantFrom(1n, 0xffn, 2n ** 248n, 2n ** 255n, 2n ** 256n - 1n),
  ),
  s: fc.oneof(
    fc.bigInt({ min: 1n, max: n / 2n }),
    fc.constantFrom(1n, 0x7fn, 2n ** 200n + 1n),
  ),
  yParity: fc.integer({ min: 0, max: 1 }),
})

const word = (value: bigint) => Hex.fromNumber(value, { size: 32 })

describe('Signature encodings', () => {
  test.prop(
    { signature, chainId: fc.integer({ min: 1, max: 2 ** 20 }) },
    { numRuns },
  )(
    'toHex matches ethers, and every encoding reads back',
    ({ signature, chainId }) => {
      const hex = Signature.toHex(signature)
      expect(hex).toBe(
        ethers.Signature.from({
          r: word(signature.r),
          s: word(signature.s),
          yParity: signature.yParity as 0 | 1,
        }).serialized,
      )
      expect(Signature.fromHex(hex)).toEqual(signature)
      expect(Signature.toBytes(signature)).toEqual(Bytes.fromHex(hex))
      expect(Signature.fromBytes(Bytes.fromHex(hex))).toEqual(signature)
      expect(Signature.from(hex)).toEqual(signature)
      // A v byte of 0 or 1 reads as yParity too, and 64 bytes as r and s.
      expect(
        Signature.fromHex(
          `${hex.slice(0, 130)}0${signature.yParity}` as Hex.Hex,
        ),
      ).toEqual(signature)
      expect(Signature.fromHex(hex.slice(0, 130) as Hex.Hex)).toEqual({
        r: signature.r,
        s: signature.s,
      })

      const rpc = Signature.toRpc(signature)
      expect(rpc).toEqual({
        r: word(signature.r),
        s: word(signature.s),
        yParity: `0x${signature.yParity}`,
      })
      expect(Signature.fromRpc(rpc)).toEqual(signature)
      expect(
        Signature.fromRpc({
          r: rpc.r,
          s: rpc.s,
          v: `0x${(27 + signature.yParity).toString(16)}`,
        }),
      ).toEqual(signature)
      expect(Signature.from(rpc)).toEqual(signature)

      const legacy = Signature.toLegacy(signature)
      expect(legacy).toEqual({
        r: signature.r,
        s: signature.s,
        v: 27 + signature.yParity,
      })
      expect(Signature.fromLegacy(legacy)).toEqual(signature)
      expect(Signature.from(legacy)).toEqual(signature)
      expect(
        Signature.fromLegacy({
          ...legacy,
          v: chainId * 2 + 35 + signature.yParity,
        }),
      ).toEqual(signature)
      expect(Signature.fromTuple(Signature.toTuple(signature))).toEqual(
        signature,
      )
    },
  )

  test.prop({ signature }, { numRuns })(
    'from, extract, assert and validate take a signature and reject what is not one',
    ({ signature }) => {
      expect(Signature.from(signature)).toEqual(signature)
      expect(Signature.extract({ ...signature, other: 1 } as never)).toEqual(
        signature,
      )
      expect(Signature.extract({ s: signature.s } as never)).toBe(undefined)
      expect(() =>
        Signature.assert(signature, { recovered: true }),
      ).not.toThrow()
      expect(Signature.validate(signature)).toBe(true)
      for (const bad of [
        { ...signature, yParity: 2 },
        { ...signature, r: 2n ** 256n },
        { ...signature, s: 2n ** 256n },
        { ...signature, r: -1n },
      ]) {
        expect(Signature.validate(bad)).toBe(false)
        expect(() => Signature.assert(bad)).toThrow()
      }
      expect(() =>
        Signature.assert(
          { r: signature.r, s: signature.s },
          { recovered: true },
        ),
      ).toThrow()
    },
  )

  test.prop({ signature }, { numRuns })(
    'toDerHex matches noble, and DER reads back',
    ({ signature }) => {
      if (signature.r >= n || signature.s >= n) return
      const der = Signature.toDerHex(signature)
      expect(der).toBe(
        `0x${new secp256k1.Signature(signature.r, signature.s).toDERHex()}`,
      )
      expect(Signature.toDerBytes(signature)).toEqual(Bytes.fromHex(der))
      expect(Signature.fromDerHex(der)).toEqual({
        r: signature.r,
        s: signature.s,
      })
      expect(Signature.fromDerBytes(Bytes.fromHex(der))).toEqual({
        r: signature.r,
        s: signature.s,
      })
    },
  )

  test.prop(
    {
      hex: fc.oneof(
        fc
          .uint8Array({ maxLength: 70 })
          .map((bytes) => Hex.fromBytes(bytes))
          .filter((hex) => hex.length !== 130 && hex.length !== 132),
        fc
          .tuple(
            fc.uint8Array({ minLength: 64, maxLength: 64 }),
            fc.integer({ min: 2, max: 26 }),
          )
          .map(
            ([body, v]) =>
              `${Hex.fromBytes(body)}${v.toString(16).padStart(2, '0')}` as Hex.Hex,
          ),
      ),
    },
    { numRuns },
  )('fromHex rejects bad sizes and v bytes', ({ hex }) => {
    expect(() => Signature.fromHex(hex)).toThrow()
  })
})
