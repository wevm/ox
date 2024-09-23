import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.validate('0x')).toBeTruthy()
  expect(Hex.validate('0x0')).toBeTruthy()
  expect(Hex.validate('0x0123456789abcdef')).toBeTruthy()
  expect(Hex.validate('0x0123456789abcdefABCDEF')).toBeTruthy()
  expect(Hex.validate('0x0123456789abcdefg')).toBeFalsy()
  expect(Hex.validate('0x0123456789abcdefg', { strict: false })).toBeTruthy()
  expect(Hex.validate({ foo: 'bar' })).toBeFalsy()
  expect(Hex.validate(undefined)).toBeFalsy()
})
