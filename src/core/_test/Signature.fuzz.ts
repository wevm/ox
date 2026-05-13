import { fc, test } from '@fast-check/vitest'
import { Signature } from 'ox'
import { describe, expect } from 'vitest'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

/**
 * Arbitrary secp256k1-style signature components. ox enforces:
 *
 * - `r` and `s` are `bigint` in `(0, secp256k1n)`. The arbitrary uses
 *   `[1, 2^256 - 1]` as a loose upper bound -- the curve order is just
 *   below 2^256, so the encoders/decoders should accept any 256-bit
 *   non-zero value at the serialization layer.
 * - `yParity` is `0 | 1`.
 *
 * Use a tighter range for fuzz so we exercise the canonical encoding
 * (full 32-byte `r`/`s`) instead of edge values that may underflow
 * fixed-width formats.
 */
const arbitrarySignature = fc.record({
  r: fc.bigInt({ min: 1n, max: 2n ** 256n - 2n }),
  s: fc.bigInt({ min: 1n, max: 2n ** 256n - 2n }),
  yParity: fc.constantFrom(0, 1),
})

describe('Signature round-trip', () => {
  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromHex(toHex(s)) ≡ s',
    ({ sig }) => {
      const hex = Signature.fromParts(sig)
      expect(Signature.fromHex(Signature.toHex(hex))).toEqual(hex)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromBytes(toBytes(s)) ≡ s',
    ({ sig }) => {
      const hex = Signature.fromParts(sig)
      expect(Signature.fromBytes(Signature.toBytes(hex))).toEqual(hex)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromTuple(toTuple(s)) ≡ s',
    ({ sig }) => {
      const hex = Signature.fromParts(sig)
      expect(Signature.fromTuple(Signature.toTuple(hex))).toEqual(hex)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromRpc(toRpc(s)) ≡ s',
    ({ sig }) => {
      const hex = Signature.fromParts(sig)
      expect(Signature.fromRpc(Signature.toRpc(hex))).toEqual(hex)
    },
  )

  test.prop({ sig: arbitrarySignature }, { numRuns })(
    'fromCompactBytes(toCompactBytes(s)) ≡ s (without recovery)',
    ({ sig }) => {
      const stripped = Signature.fromParts<false>({ r: sig.r, s: sig.s })
      expect(
        Signature.fromCompactBytes(Signature.toCompactBytes(stripped)),
      ).toEqual(stripped)
    },
  )
})
