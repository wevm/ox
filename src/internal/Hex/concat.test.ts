import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.concat('0x0', '0x1')).toBe('0x01')
  expect(Hex.concat('0x1', '0x69', '0x420')).toBe('0x169420')
  expect(Hex.concat('0x00000001', '0x00000069', '0x00000420')).toBe(
    '0x000000010000006900000420',
  )
})
