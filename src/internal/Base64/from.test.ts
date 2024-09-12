import { Base64, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base64.from('hello wo�d')).toBe('aGVsbG8gd29/77+9ZA==')
  expect(Base64.from(Hex.from('hello wo�d'))).toBe('aGVsbG8gd29/77+9ZA==')
  expect(Base64.from(Bytes.from('hello wo�d'))).toBe('aGVsbG8gd29/77+9ZA==')
})

test('options: pad: false', () => {
  expect(Base64.from('hello wo�d', { pad: false })).toBe('aGVsbG8gd29/77+9ZA')
  expect(Base64.from(Hex.from('hello wo�d'), { pad: false })).toBe(
    'aGVsbG8gd29/77+9ZA',
  )
  expect(Base64.from(Bytes.from('hello wo�d'), { pad: false })).toBe(
    'aGVsbG8gd29/77+9ZA',
  )
})

test('options: url: true', () => {
  expect(Base64.from('hello wo�d', { url: true })).toBe('aGVsbG8gd29_77-9ZA==')
  expect(Base64.from(Hex.from('hello wo�d'), { url: true })).toBe(
    'aGVsbG8gd29_77-9ZA==',
  )
  expect(Base64.from(Bytes.from('hello wo�d'), { url: true })).toBe(
    'aGVsbG8gd29_77-9ZA==',
  )
})

test('fromString', () => {
  expect(Base64.fromString('hello wo�d')).toBe('aGVsbG8gd29/77+9ZA==')
  expect(Base64.fromString('hello wo�d', { url: true })).toBe(
    'aGVsbG8gd29_77-9ZA==',
  )
  expect(Base64.fromString('hello wo�d', { pad: false })).toBe(
    'aGVsbG8gd29/77+9ZA',
  )
})

test('fromHex', () => {
  expect(Base64.fromHex(Hex.from('hello wo�d'))).toBe('aGVsbG8gd29/77+9ZA==')
  expect(Base64.fromHex(Hex.from('hello wo�d'), { url: true })).toBe(
    'aGVsbG8gd29_77-9ZA==',
  )
  expect(Base64.fromHex(Hex.from('hello wo�d'), { pad: false })).toBe(
    'aGVsbG8gd29/77+9ZA',
  )
})

test('fromBytes', () => {
  expect(Base64.fromBytes(Bytes.from('hello wo�d'))).toBe(
    'aGVsbG8gd29/77+9ZA==',
  )
  expect(Base64.fromBytes(Bytes.from('hello wo�d'), { url: true })).toBe(
    'aGVsbG8gd29_77-9ZA==',
  )
  expect(Base64.fromBytes(Bytes.from('hello wo�d'), { pad: false })).toBe(
    'aGVsbG8gd29/77+9ZA',
  )
})
