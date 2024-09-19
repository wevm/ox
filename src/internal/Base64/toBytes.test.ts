import { Base64, Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  // pad
  expect(Base64.toBytes('aGVsbG8gd29/77+9ZA==')).toStrictEqual(
    Bytes.fromString('hello wo�d'),
  )
  // no pad
  expect(Base64.toBytes('aGVsbG8gd29/77+9ZA')).toStrictEqual(
    Bytes.fromString('hello wo�d'),
  )
  // url
  expect(Base64.toBytes('aGVsbG8gd29_77-9ZA==')).toStrictEqual(
    Bytes.fromString('hello wo�d'),
  )
})
