import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.isBytes(new Uint8Array([1, 69, 420])))
  expect(Bytes.isBytes('0x1')).toBeFalsy()
  expect(Bytes.isBytes({})).toBeFalsy()
  expect(Bytes.isBytes(undefined)).toBeFalsy()
})
