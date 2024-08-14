import { expect, test } from 'vitest'

import { Data } from 'ox'

test('is bytes', () => {
  // true
  expect(
    Data.isBytesEqual(
      new Uint8Array([1, 69, 420]),
      new Uint8Array([1, 69, 420]),
    ),
  ).toBeTruthy()
  expect(Data.isBytesEqual('0x1', '0x1')).toBeTruthy()
  expect(Data.isBytesEqual('0x1', '0x01')).toBeTruthy()

  // false
  expect(
    Data.isBytesEqual(
      new Uint8Array([1, 69, 420]),
      new Uint8Array([1, 69, 421]),
    ),
  ).toBeFalsy()
  expect(Data.isBytesEqual('0x1', '0x2')).toBeFalsy()
  expect(Data.isBytesEqual('0x1', '0x10')).toBeFalsy()
})
