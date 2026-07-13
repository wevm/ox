import { fc, test } from '@fast-check/vitest'
import { Hex, Signature } from 'ox'
import { describe, expect } from 'vp/test'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

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
