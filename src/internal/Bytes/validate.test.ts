import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.validate(new Uint8Array([1, 69, 420])))
  expect(Bytes.validate('0x1')).toBeFalsy()
  expect(Bytes.validate({})).toBeFalsy()
  expect(Bytes.validate(undefined)).toBeFalsy()
})
