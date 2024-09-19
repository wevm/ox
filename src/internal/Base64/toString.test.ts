import { Base64 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  // pad
  expect(Base64.toString('aGVsbG8gd29/77+9ZA==')).toStrictEqual('hello wo�d')
  // no pad
  expect(Base64.toString('aGVsbG8gd29/77+9ZA')).toStrictEqual('hello wo�d')
  // url
  expect(Base64.toString('aGVsbG8gd29_77-9ZA==')).toStrictEqual('hello wo�d')
})
