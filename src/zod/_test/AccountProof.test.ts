import { describe, expect, test } from 'vp/test'
import * as z_AccountProof from '../AccountProof.js'
import * as z from 'zod/mini'

const proof = {
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
} as const

describe('AccountProof', () => {
  test('decodes and encodes account proofs', () => {
    expect(z.decode(z_AccountProof.AccountProof, proof)).toMatchInlineSnapshot(`
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
    expect(
      z.encode(z_AccountProof.AccountProof, {
        ...proof,
        balance: 1n,
        nonce: 2,
        storageProof: [
          {
            key: proof.storageProof[0].key,
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

  test('AccountProofToRpc accepts numberish encode inputs', () => {
    const decoded = {
      ...proof,
      balance: 1n,
      nonce: 2,
      storageProof: [
        { key: proof.storageProof[0].key, proof: ['0xdead'], value: 3n },
      ],
    } as const
    const expected = z.encode(z_AccountProof.AccountProof, decoded)

    expect(
      z.encode(z_AccountProof.AccountProofToRpc, {
        ...decoded,
        balance: 1,
        storageProof: [
          { key: proof.storageProof[0].key, proof: ['0xdead'], value: 3 },
        ],
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_AccountProof.AccountProofToRpc, {
        ...decoded,
        balance: '0x1',
        nonce: '0x2',
        storageProof: [
          { key: proof.storageProof[0].key, proof: ['0xdead'], value: '0x3' },
        ],
      }),
    ).toEqual(expected)
  })

  test('validates storage proofs', () => {
    expect(z.decode(z_AccountProof.StorageProof, proof.storageProof[0]))
      .toMatchInlineSnapshot(`
        {
          "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "proof": [
            "0xdead",
          ],
          "value": 3n,
        }
      `)
    expect(
      z.safeDecode(z_AccountProof.StorageProof, {
        ...proof.storageProof[0],
        value: '-0x1',
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })
})
