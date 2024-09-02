import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.size(new Uint8Array([]))).toBe(0)
  expect(Bytes.size(new Uint8Array([1]))).toBe(1)
  expect(Bytes.size(new Uint8Array([1, 2]))).toBe(2)
  expect(Bytes.size(new Uint8Array([1, 2, 3, 4]))).toBe(4)
})
