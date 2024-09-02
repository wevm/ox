import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.size('0x')).toBe(0)
  expect(Hex.size('0x1')).toBe(1)
  expect(Hex.size('0x12')).toBe(1)
  expect(Hex.size('0x1234')).toBe(2)
  expect(Hex.size('0x12345678')).toBe(4)
})
