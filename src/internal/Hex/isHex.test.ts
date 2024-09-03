import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.isHex('0x')).toBeTruthy()
  expect(Hex.isHex('0x0')).toBeTruthy()
  expect(Hex.isHex('0x0123456789abcdef')).toBeTruthy()
  expect(Hex.isHex('0x0123456789abcdefABCDEF')).toBeTruthy()
  expect(Hex.isHex('0x0123456789abcdefg')).toBeFalsy()
  expect(Hex.isHex('0x0123456789abcdefg', { strict: false })).toBeTruthy()
  expect(Hex.isHex({ foo: 'bar' })).toBeFalsy()
  expect(Hex.isHex(undefined)).toBeFalsy()
})
