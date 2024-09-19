import { Base64 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base64.fromString('hello wo�d')).toBe('aGVsbG8gd29/77+9ZA==')
  expect(Base64.fromString('hello wo�d', { url: true })).toBe(
    'aGVsbG8gd29_77-9ZA==',
  )
  expect(Base64.fromString('hello wo�d', { pad: false })).toBe(
    'aGVsbG8gd29/77+9ZA',
  )
})
