import { mapHashToField } from '@noble/curves/abstract/modular.js'
import { bls12_381 } from '@noble/curves/bls12-381.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { p256 } from '@noble/curves/nist.js'
import { expect, test } from 'vp/test'
import { mapToSecretKey, p256N, secp256k1N } from '../internal/curves.js'

test('p256N matches @noble/curves', () => {
  expect(p256N).toEqual(p256.Point.CURVE().n)
})

test('secp256k1N matches @noble/curves', () => {
  expect(secp256k1N).toEqual(secp256k1.Point.Fn.ORDER)
})

test('mapToSecretKey matches mapHashToField', () => {
  const seed = (value: bigint) =>
    Uint8Array.from(Buffer.from(value.toString(16).padStart(96, '0'), 'hex'))
  for (const order of [p256N, secp256k1N, bls12_381.fields.Fr.ORDER])
    for (const value of [
      0n,
      // The seeds that reduce to the smallest and the largest key.
      order - 1n,
      order - 2n,
      2n * order - 3n,
      order ** 2n / 3n,
      2n ** 384n - 1n,
    ]) {
      const key = mapToSecretKey(seed(value), order)
      expect(key).toEqual(mapHashToField(seed(value), order))
      expect(key.length).toBe(32)
    }
})
