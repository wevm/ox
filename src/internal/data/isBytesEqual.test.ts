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
  expect(Data.isBytesEqual('0x01', '0x01')).toBeTruthy()

  // false
  expect(
    Data.isBytesEqual(
      new Uint8Array([1, 69, 420]),
      new Uint8Array([1, 69, 421]),
    ),
  ).toBeFalsy()
  expect(Data.isBytesEqual('0x01', '0x02')).toBeFalsy()
})
