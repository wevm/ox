import { p256 } from '@noble/curves/nist.js'
import { expect, test } from 'vp/test'
import { p256N } from '../internal/curves.js'

test('p256N matches @noble/curves', () => {
  expect(p256N).toEqual(p256.Point.CURVE().n)
})
