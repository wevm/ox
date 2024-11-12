import { AccessList } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromTupleList', () => {
  test('default', () => {
    expect(
      AccessList.fromTupleList([
        [
          '0x1234512345123451234512345123451234512345',
          [
            '0x1234512345123451234512345123451234512345',
            '0x0000512345123451234512345123451234512345',
            '0x1234512345123451234512345123451234512345123451234512345123423232',
          ],
        ],
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "0x1234512345123451234512345123451234512345",
          "storageKeys": [
            "0x1234512345123451234512345123451234512345",
            "0x512345123451234512345123451234512345",
            "0x1234512345123451234512345123451234512345123451234512345123423232",
          ],
        },
      ]
    `)
  })
})

describe('toTupleList', () => {
  test('when accessList is empty', () => {
    expect(AccessList.toTupleList([])).toEqual([])
  })

  test('when accessList contains in invalid Address', () => {
    expect(() =>
      AccessList.toTupleList([{ address: '0x123', storageKeys: [] }]),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0x123" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })

  test('when accessList contains in invalid Storage Key', () => {
    const badKey = '0xI like cheese'
    expect(() =>
      AccessList.toTupleList([
        {
          address: '0x123',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            badKey,
          ],
        },
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccessList.InvalidStorageKeySizeError: Size for storage key "0xI like cheese" is invalid. Expected 32 bytes. Got 7 bytes.]`,
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

    expect(AccessList.toTupleList(accessList)).toEqual([
      [
        '0x0000000000000000000000000000000000000000',
        [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      ],
    ])
  })
})
