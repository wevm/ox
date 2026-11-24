import { mapHashToField } from '@noble/curves/abstract/modular'
import { bls12_381 } from '@noble/curves/bls12-381'
import { p256 } from '@noble/curves/nist.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { expect, test } from 'vitest'
import * as Bytes from '../Bytes.js'
import { mapToSecretKey, p256N, secp256k1N } from '../internal/curves.js'

test('p256N matches @noble/curves', () => {
  expect(p256N).toEqual(p256.CURVE.n)
})

test('secp256k1N matches @noble/curves', () => {
  expect(secp256k1N).toEqual(secp256k1.CURVE.n)
})

test('mapToSecretKey matches mapHashToField', () => {
  const seed = (value: bigint) =>
    Bytes.fromHex(`0x${value.toString(16).padStart(96, '0')}`)
  for (const order of [p256N, secp256k1N, bls12_381.params.r])
    for (const value of [
      0n,
      // The seeds that reduce to the smallest and the largest key.
      order - 1n,
      order - 2n,
      2n * order - 3n,
      order ** 2n / 3n,
      2n ** 384n - 1n,
    ])
      expect(
        Bytes.fromNumber(mapToSecretKey(seed(value), order), { size: 32 }),
      ).toEqual(mapHashToField(seed(value), order))
})
