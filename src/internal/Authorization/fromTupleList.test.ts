import { Authorization } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const tupleList = [
    ['0x01', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x28'],
    ['0x03', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x14'],
  ] as const satisfies Authorization.TupleList
  const authorization = Authorization.fromTupleList(tupleList)
  expect(authorization).toMatchInlineSnapshot(`
    [
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
      },
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 3,
        "nonce": 20n,
      },
    ]
  `)
})

test('behavior: signature', () => {
  const tupleList = [
    [
      '0x05',
      '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      '0x2a',
      '0x',
      '0x01',
      '0x02',
    ],
    [
      '0x02',
      '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      '0x2b',
      '0x',
      '0x04',
      '0x05',
    ],
  ] as const satisfies Authorization.TupleList
  const authorization = Authorization.fromTupleList(tupleList)
  expect(authorization).toMatchInlineSnapshot(`
    [
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 5,
        "nonce": 42n,
        "r": 1n,
        "s": 2n,
        "yParity": 0,
      },
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 2,
        "nonce": 43n,
        "r": 4n,
        "s": 5n,
        "yParity": 0,
      },
    ]
  `)
})
