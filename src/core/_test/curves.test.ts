import { secp256k1 } from '@noble/curves/secp256k1.js'
import { p256 } from '@noble/curves/nist.js'
import { expect, test } from 'vp/test'
import { p256N, secp256k1N } from '../internal/curves.js'

test('p256N matches @noble/curves', () => {
  expect(p256N).toEqual(p256.Point.CURVE().n)
})

test('secp256k1N matches @noble/curves', () => {
  expect(secp256k1N).toEqual(secp256k1.Point.Fn.ORDER)
})
