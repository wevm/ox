import { Base64, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base64.toString('aGVsbG8gd29/77+9ZA==')).toBe('hello wo�d')
  expect(Base64.toHex('aGVsbG8gd29/77+9ZA==')).toBe(
    Hex.fromString('hello wo�d'),
  )
  expect(Base64.toBytes('aGVsbG8gd29/77+9ZA==')).toStrictEqual(
    Bytes.fromString('hello wo�d'),
  )
})

test('behavior: no pad', () => {
  expect(Base64.toString('aGVsbG8gd29/77+9ZA')).toBe('hello wo�d')
  expect(Base64.toHex('aGVsbG8gd29/77+9ZA')).toBe(Hex.fromString('hello wo�d'))
  expect(Base64.toBytes('aGVsbG8gd29/77+9ZA')).toStrictEqual(
    Bytes.fromString('hello wo�d'),
  )
})

test('behavior: url', () => {
  expect(Base64.toString('aGVsbG8gd29_77-9ZA==')).toBe('hello wo�d')
  expect(Base64.toHex('aGVsbG8gd29_77-9ZA==')).toBe(
    Hex.fromString('hello wo�d'),
  )
  expect(Base64.toBytes('aGVsbG8gd29_77-9ZA==')).toStrictEqual(
    Bytes.fromString('hello wo�d'),
  )
})
