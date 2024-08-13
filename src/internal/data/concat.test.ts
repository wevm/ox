import { Data } from 'stdeth'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Data.concat('0x0', '0x1')).toBe('0x01')
  expect(Data.concat('0x1', '0x69', '0x420')).toBe('0x169420')
  expect(Data.concat('0x00000001', '0x00000069', '0x00000420')).toBe(
    '0x000000010000006900000420',
  )

  expect(Data.concat(new Uint8Array([0]), new Uint8Array([1]))).toStrictEqual(
    new Uint8Array([0, 1]),
  )
  expect(
    Data.concat(
      new Uint8Array([1]),
      new Uint8Array([69]),
      new Uint8Array([420, 69]),
    ),
  ).toStrictEqual(new Uint8Array([1, 69, 420, 69]))
  expect(
    Data.concat(
      new Uint8Array([0, 0, 0, 1]),
      new Uint8Array([0, 0, 0, 69]),
      new Uint8Array([0, 0, 420, 69]),
    ),
  ).toStrictEqual(new Uint8Array([0, 0, 0, 1, 0, 0, 0, 69, 0, 0, 420, 69]))
})
