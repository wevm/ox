import { fc, test } from '@fast-check/vitest'
import { mapHashToField } from '@noble/curves/abstract/modular.js'
import { bls12_381 } from '@noble/curves/bls12-381.js'
import { Bytes } from 'ox'
import { describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import { mapToSecretKey, p256N, secp256k1N } from '../internal/curves.js'

describe('mapToSecretKey', () => {
  test.prop(
    {
      input: fc
        .constantFrom(p256N, secp256k1N, bls12_381.fields.Fr.ORDER)
        .chain((order) =>
          fc.record({
            order: fc.constant(order),
            seed: fc.oneof(
              fc.uint8Array({ maxLength: 48, minLength: 48 }),
              // Seeds next to a multiple of `order - 1`, where the reduction
              // wraps to the smallest and the largest key.
              fc
                .tuple(
                  fc.bigInt({ max: 2n ** 129n, min: 0n }),
                  fc.integer({ max: 3, min: -3 }),
                )
                .map(([k, delta]) => k * (order - 1n) + BigInt(delta))
                .filter((value) => value >= 0n && value < 2n ** 384n)
                .map((value) => Bytes.fromNumber(value, { size: 48 })),
            ),
          }),
        ),
    },
    { numRuns },
  )(
    'reduces a 48-byte seed as mapHashToField does',
    ({ input: { order, seed } }) => {
      expect(mapToSecretKey(seed, order)).toEqual(mapHashToField(seed, order))
    },
  )
})
