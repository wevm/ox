import { Data } from 'ox'
import { expect, test } from 'vitest'

test('hex', () => {
  expect(Data.size('0x')).toBe(0)
  expect(Data.size('0x1')).toBe(1)
  expect(Data.size('0x12')).toBe(1)
  expect(Data.size('0x1234')).toBe(2)
  expect(Data.size('0x12345678')).toBe(4)
})

test('bytes', () => {
  expect(Data.size(new Uint8Array([]))).toBe(0)
  expect(Data.size(new Uint8Array([1]))).toBe(1)
  expect(Data.size(new Uint8Array([1, 2]))).toBe(2)
  expect(Data.size(new Uint8Array([1, 2, 3, 4]))).toBe(4)
})
