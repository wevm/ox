import { expect, test } from 'vitest'

import { Bytes } from 'ox'

test('is bytes', () => {
  // true
  expect(
    Bytes.isEqual(new Uint8Array([1, 69, 420]), new Uint8Array([1, 69, 420])),
  ).toBeTruthy()

  // false
  expect(
    Bytes.isEqual(new Uint8Array([1, 69, 420]), new Uint8Array([1, 69, 421])),
  ).toBeFalsy()
})
