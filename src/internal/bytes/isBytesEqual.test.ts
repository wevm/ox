import { expect, test } from 'vitest'

import { Bytes } from 'ox'

test('is bytes', () => {
  // true
  expect(
    Bytes.isEqual(new Uint8Array([1, 69, 420]), new Uint8Array([1, 69, 420])),
  ).toBeTruthy()
  expect(Bytes.isEqual('0x01', '0x01')).toBeTruthy()

  // false
  expect(
    Bytes.isEqual(new Uint8Array([1, 69, 420]), new Uint8Array([1, 69, 421])),
  ).toBeFalsy()
  expect(Bytes.isEqual('0x01', '0x02')).toBeFalsy()
})
