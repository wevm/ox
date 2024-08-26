import { expect, test } from 'vitest'

import { Hex } from 'ox'

test('is bytes', () => {
  // true
  expect(Hex.isEqual('0x01', '0x01')).toBeTruthy()

  // false
  expect(Hex.isEqual('0x01', '0x02')).toBeFalsy()
})
