import { fc, test } from '@fast-check/vitest'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { Hex, Signature } from 'ox'
import { serializeSignature } from 'viem'
import { describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'

/**
 * Arbitrary secp256k1-style signature components. ox enforces:
 *
 * - `r` and `s` are 32-byte padded `Hex.Hex` values in `(0, secp256k1n)`.
 *   The arbitrary uses `[1, 2^256 - 1]` as a loose upper bound -- the curve
 *   order is just below 2^256, so the encoders/decoders should accept any
 *   256-bit non-zero value at the serialization layer.
 * - `yParity` is `0 | 1`.
 */
const arbitrarySignature = fc
  .record({
    r: fc.bigInt({ min: 1n, max: 2n ** 256n - 2n }),
    s: fc.bigInt({ min: 1n, max: 2n ** 256n - 2n }),
    yParity: fc.constantFrom<0 | 1>(0, 1),
  })
  .map(({ r, s, yParity }) => ({
    r: Hex.fromNumber(r, { size: 32 }),
    s: Hex.fromNumber(s, { size: 32 }),
    yParity,
  }))

describe('Signature round-trip', () => {
  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromHex(toHex(s)) ≡ s',
    ({ sig }) => {
      expect(Signature.fromHex(Signature.toHex(sig))).toEqual(sig)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromBytes(toBytes(s)) ≡ s',
    ({ sig }) => {
      expect(Signature.fromBytes(Signature.toBytes(sig))).toEqual(sig)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromTuple(toTuple(s)) ≡ s',
    ({ sig }) => {
      expect(Signature.fromTuple(Signature.toTuple(sig))).toEqual(sig)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromRpc(toRpc(s)) ≡ s',
    ({ sig }) => {
      expect(Signature.fromRpc(Signature.toRpc(sig))).toEqual(sig)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromCompactBytes(toCompactBytes(s)) ≡ s (without recovery)',
    ({ sig }) => {
      const stripped = { r: sig.r, s: sig.s }
      expect(
        Signature.fromCompactBytes(Signature.toCompactBytes(stripped)),
      ).toEqual(stripped)
    },
  )
})

/** A signature whose scalars are below the secp256k1 order, as DER encoding requires. */
const arbitraryCurveSignature = fc
  .record({
    r: fc.bigInt({ max: secp256k1.Point.Fn.ORDER - 1n, min: 1n }),
    s: fc.bigInt({ max: secp256k1.Point.Fn.ORDER - 1n, min: 1n }),
    yParity: fc.constantFrom<0 | 1>(0, 1),
  })
  .map(({ r, s, yParity }) => ({
    r: Hex.fromNumber(r, { size: 32 }),
    s: Hex.fromNumber(s, { size: 32 }),
    yParity,
  }))

describe('Signature conversions', () => {
  test.prop({ sig: arbitraryCurveSignature }, { numRuns })(
    'DER, recovered and legacy forms round-trip, and toHex matches viem',
    ({ sig }) => {
      const { r, s } = sig
      expect(Signature.fromDerHex(Signature.toDerHex(sig))).toEqual({ r, s })
      expect(Signature.fromDerBytes(Signature.toDerBytes(sig))).toEqual({
        r,
        s,
      })
      expect(
        Signature.fromRecoveredBytes(Signature.toRecoveredBytes(sig)),
      ).toEqual(sig)
      expect(Signature.fromLegacy(Signature.toLegacy(sig))).toEqual(sig)
      expect(Signature.toHex(sig)).toBe(serializeSignature(sig))
      expect(Signature.from(sig)).toEqual(sig)
      // A transaction carries other fields beside its signature.
      const transaction = { ...sig, chainId: 1 }
      expect(Signature.extract(transaction)).toEqual(sig)
    },
  )
})

/**
 * Spellings of an `r` or `s` value: hex of 1 to 64 digits in either case,
 * hex around 2^256 with and without leading zeros, and strings `BigInt` parses
 * or rejects otherwise.
 */
const arbitraryScalar = fc.oneof(
  fc
    .tuple(fc.integer({ max: 64, min: 1 }), fc.boolean())
    .chain(([length, upper]) =>
      fc
        .stringMatching(new RegExp(`^[0-9a-f]{${length}}$`))
        .map((digits) => `0x${upper ? digits.toUpperCase() : digits}`),
    ),
  // Values on both sides of 2^256, behind up to 8 leading zeros.
  fc
    .tuple(
      fc.integer({ max: 8, min: 0 }),
      fc.oneof(
        fc.bigInt({ max: 2n ** 256n + 2n ** 16n, min: 2n ** 256n - 2n ** 16n }),
        fc.bigInt({ max: 2n ** 260n, min: 0n }),
      ),
    )
    .map(([zeros, value]) => `0x${'0'.repeat(zeros)}${value.toString(16)}`),
  fc.bigInt({ max: 2n ** 257n, min: 0n }).map(String),
  fc
    .bigInt({ max: 2n ** 256n, min: 1n })
    .map((value) => `-0x${value.toString(16)}`),
  fc.stringMatching(/^0x[0-9a-fg ]{0,66}$/),
  fc.constantFrom('', '0x', '0X10', ' 0x12', '0x12 ', '0b1', '0o7'),
  fc.string({ maxLength: 70 }),
)

describe('Signature.validate', () => {
  test.prop({ scalar: arbitraryScalar }, { numRuns })(
    'accepts r and s exactly when BigInt reads them as 0 to 2^256 - 1',
    ({ scalar }) => {
      const expected = (() => {
        try {
          const value = BigInt(scalar)
          return value >= 0n && value < 2n ** 256n
        } catch {
          return false
        }
      })()
      const valid = { r: '0x01', s: '0x01', yParity: 0 } as const
      expect(Signature.validate({ ...valid, r: scalar as Hex.Hex })).toBe(
        expected,
      )
      expect(Signature.validate({ ...valid, s: scalar as Hex.Hex })).toBe(
        expected,
      )
    },
  )
})
