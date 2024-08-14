import { Data } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Data.isHex('0x')).toBeTruthy()
  expect(Data.isHex('0x0')).toBeTruthy()
  expect(Data.isHex('0x0123456789abcdef')).toBeTruthy()
  expect(Data.isHex('0x0123456789abcdefABCDEF')).toBeTruthy()
  expect(Data.isHex('0x0123456789abcdefg')).toBeFalsy()
  expect(Data.isHex('0x0123456789abcdefg', { strict: false })).toBeTruthy()
  expect(Data.isHex({ foo: 'bar' })).toBeFalsy()
  expect(Data.isHex(undefined)).toBeFalsy()
})
