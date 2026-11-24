import { fc, test } from '@fast-check/vitest'
import { mapHashToField } from '@noble/curves/abstract/modular'
import { bls12_381 } from '@noble/curves/bls12-381'
import { Bls, Bytes, P256, Secp256k1 } from 'ox'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import { mapToSecretKey, p256N, secp256k1N } from '../internal/curves.js'

const orders = [p256N, secp256k1N, bls12_381.params.r]

describe('random private keys', () => {
  test.prop(
    {
      seed: fc.oneof(
        fc.uint8Array({ minLength: 48, maxLength: 64 }),
        // 48-byte seeds next to multiples of `order - 1`, where the reduction
        // wraps.
        fc
          .record({
            order: fc.constantFrom(...orders),
            multiple: fc.bigInt({ min: 0n, max: 2n ** 128n }),
            offset: fc.integer({ min: -2, max: 2 }),
          })
          .map(({ order, multiple, offset }) => {
            const value = multiple * (order - 1n) + BigInt(offset)
            return Bytes.fromNumber(value < 0n ? 0n : value, { size: 48 })
          }),
      ),
      order: fc.constantFrom(...orders),
    },
    { numRuns },
  )(
    'mapToSecretKey reduces a seed to the key noble’s mapHashToField gives',
    ({ seed, order }) => {
      expect(mapToSecretKey(seed, order)).toBe(
        Bytes.toBigInt(mapHashToField(seed, order)),
      )
    },
  )

  test.prop({ run: fc.nat() }, { numRuns: Math.min(numRuns, 200) })(
    'randomPrivateKey returns a key in 1..n-1 that derives a public key',
    () => {
      const keys = [
        [Secp256k1.randomPrivateKey(), secp256k1N],
        [P256.randomPrivateKey(), p256N],
        [Bls.randomPrivateKey(), bls12_381.params.r],
      ] as const
      for (const [key, order] of keys) {
        expect(key).toMatch(/^0x[0-9a-f]{64}$/)
        const value = BigInt(key)
        expect(value > 0n && value < order).toBe(true)
      }
      expect(() =>
        Secp256k1.getPublicKey({ privateKey: keys[0][0] }),
      ).not.toThrow()
      expect(() => P256.getPublicKey({ privateKey: keys[1][0] })).not.toThrow()
      expect(Secp256k1.randomPrivateKey({ as: 'Bytes' }).length).toBe(32)
    },
  )
})
