import { Base64, Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base64.fromBytes(Bytes.fromString('hello wo�d'))).toBe(
    'aGVsbG8gd29/77+9ZA==',
  )
  expect(Base64.fromBytes(Bytes.fromString('hello wo�d'), { url: true })).toBe(
    'aGVsbG8gd29_77-9ZA==',
  )
  expect(Base64.fromBytes(Bytes.fromString('hhello wo�d'), { url: true })).toBe(
    'aGhlbGxvIHdvf--_vWQ=',
  )
  expect(Base64.fromBytes(Bytes.fromString('hello wo�d'), { pad: false })).toBe(
    'aGVsbG8gd29/77+9ZA',
  )
})
