import { expect, test } from 'vitest'

import { toAccessTupleList } from './toAccessTupleList.js'

test('when accessList is empty', () => {
  expect(toAccessTupleList([])).toEqual([])
})

test('when accessList contains in invalid Address', () => {
  expect(() =>
    toAccessTupleList([{ address: '0x123', storageKeys: [] }]),
  ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0x123" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror]
    `)
})

test('when accessList contains in invalid Storage Key', () => {
  const badKey = '0xI like cheese'
  expect(() =>
    toAccessTupleList([
      {
        address: '0x123',
        storageKeys: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          badKey,
        ],
      },
    ]),
  ).toThrowErrorMatchingInlineSnapshot(
    `[InvalidStorageKeySizeError: Size for storage key "0xI like cheese" is invalid. Expected 32 bytes. Got 7 bytes.]`,
  )
})

test('with valid accessList', () => {
  const accessList = [
    {
      address: '0x0000000000000000000000000000000000000000',
      storageKeys: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      ],
    },
  ] as const

  expect(toAccessTupleList(accessList)).toEqual([
    [
      '0x0000000000000000000000000000000000000000',
      [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      ],
    ],
  ])
})
