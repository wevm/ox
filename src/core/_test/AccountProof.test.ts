import { AccountProof } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromRpc', () => {
  test('default', () => {
    expect(
      AccountProof.fromRpc({
        address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        balance: '0x1',
        codeHash:
          '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
        nonce: '0x2',
        storageHash:
          '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        accountProof: ['0xabcd', '0x1234'],
        storageProof: [
          {
            key: '0x0000000000000000000000000000000000000000000000000000000000000000',
            proof: ['0xdead'],
            value: '0x3',
          },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "accountProof": [
          "0xabcd",
          "0x1234",
        ],
        "address": "0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9",
        "balance": 1n,
        "codeHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "nonce": 2,
        "storageHash": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
        "storageProof": [
          {
            "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "proof": [
              "0xdead",
            ],
            "value": 3n,
          },
        ],
      }
    `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    expect(
      AccountProof.toRpc({
        address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        balance: 1n,
        codeHash:
          '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
        nonce: 2,
        storageHash:
          '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        accountProof: ['0xabcd', '0x1234'],
        storageProof: [
          {
            key: '0x0000000000000000000000000000000000000000000000000000000000000000',
            proof: ['0xdead'],
            value: 3n,
          },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "accountProof": [
          "0xabcd",
          "0x1234",
        ],
        "address": "0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9",
        "balance": "0x1",
        "codeHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "nonce": "0x2",
        "storageHash": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
        "storageProof": [
          {
            "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "proof": [
              "0xdead",
            ],
            "value": "0x3",
          },
        ],
      }
    `)
  })

  test('round-trip', () => {
    const value = {
      address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      balance: 0n,
      codeHash:
        '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
      nonce: 0,
      storageHash:
        '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
      accountProof: [],
      storageProof: [],
    } as const
    expect(AccountProof.fromRpc(AccountProof.toRpc(value))).toEqual(value)
  })
})

test('exports', () => {
  expect(Object.keys(AccountProof)).toMatchInlineSnapshot(`
    [
      "fromRpc",
      "toRpc",
    ]
  `)
})
