import { expect, test } from 'vitest'
import { Signature } from 'ox'

test('default', () => {
  expect(
    Signature.validate({
      r: 0n,
      s: 0n,
      yParity: 0,
    }),
  ).toBe(true)
  expect(
    Signature.validate({
      r: -1n,
      s: 0n,
      yParity: 0,
    }),
  ).toBe(false)
})
