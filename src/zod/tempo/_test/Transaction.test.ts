import { describe, expect, test } from 'vp/test'
import * as z_Transaction from '../Transaction.js'
import * as z from 'zod/mini'

const rpc = {
  accessList: [],
  blockHash:
    '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
  blockNumber: '0x12f296f',
  blockTimestamp: '0x66434e07',
  calls: [
    {
      input: '0xdeadbeef',
      to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      value: '0x9b6e64a8ec60000',
    },
  ],
  chainId: '0x1',
  feeToken: '0x20c0000000000000000000000000000000000000',
  from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
  gas: '0x43f5d',
  gasPrice: '0x2ca6ae494',
  hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
  maxFeePerGas: '0x2',
  maxPriorityFeePerGas: '0x1',
  nonce: '0x357',
  signature: {
    r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
    s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
    type: 'secp256k1',
    v: '0x0',
    yParity: '0x0',
  },
  transactionIndex: '0x2',
  type: '0x76',
} as const

/** Mined shape as serialized by the tempo node (absent optionals are `null`). */
const nodeRpc = {
  accessList: [],
  aaAuthorizationList: [],
  blockHash:
    '0xa27e7b87e6f558014cb357e8361579de7f8bff8c2f39beb47e5cc75cd7bbba40',
  blockNumber: '0x5a',
  blockTimestamp: '0x6a4d7ca5',
  calls: [
    {
      data: null,
      input:
        '0x5c559d2000000000000000000000000000000000000000000000000000000000abf52baf',
      to: '0xfdc0000000000000000000000000000000000000',
      value: '0x0',
    },
  ],
  chainId: '0x539',
  feePayerSignature: null,
  feeToken: '0x20c0000000000000000000000000000000000000',
  from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  gas: '0x81fb2',
  gasPrice: '0x23c34600',
  hash: '0x76e9adc3b5f6262159d49582a64b8696ecf5864ac5237f72b5c0797ca380e9d4',
  keyAuthorization: null,
  maxFeePerGas: '0x2aea5400',
  maxPriorityFeePerGas: '0x0',
  nonce: '0x0',
  nonceKey: '0x0',
  signature: {
    r: '0xc5363149ebd9b247cd6948469677efbed1c58be3a79ec020ff767e41196b464',
    s: '0x701c441f1ce3ca8dd0bff969924db2c8817a7dec1ade02c39c79bd57c8d0089d',
    type: 'secp256k1',
    v: '0x0',
    yParity: '0x0',
  },
  transactionIndex: '0x0',
  type: '0x76',
  validAfter: null,
  validBefore: null,
} as const

describe('Tempo', () => {
  test('decodes a tempo transaction', () => {
    const decoded = z.decode(z_Transaction.Tempo, rpc)
    expect(decoded).toMatchObject({
      blockNumber: 19868015n,
      chainId: 1,
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: 278365n,
      maxFeePerGas: 2n,
      maxPriorityFeePerGas: 1n,
      nonce: 855n,
      transactionIndex: 2,
      type: 'tempo',
    })
    expect(decoded.calls).toEqual([
      {
        data: '0xdeadbeef',
        to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
        value: 700000000000000000n,
      },
    ])
  })

  test('round-trips via encode', () => {
    const decoded = z.decode(z_Transaction.Tempo, rpc)
    const encoded = z.encode(z_Transaction.Tempo, decoded)
    expect(encoded).toMatchObject({
      blockNumber: '0x12f296f',
      chainId: '0x1',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: '0x43f5d',
      maxFeePerGas: '0x2',
      type: '0x76',
    })
  })

  test('decodes a node transaction (null optionals)', () => {
    const decoded = z.decode(z_Transaction.Tempo, nodeRpc)
    expect(decoded).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0xa27e7b87e6f558014cb357e8361579de7f8bff8c2f39beb47e5cc75cd7bbba40",
        "blockNumber": 90n,
        "blockTimestamp": 1783463077n,
        "calls": [
          {
            "data": "0x5c559d2000000000000000000000000000000000000000000000000000000000abf52baf",
            "to": "0xfdc0000000000000000000000000000000000000",
            "value": 0n,
          },
        ],
        "chainId": 1337,
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "gas": 532402n,
        "gasPrice": 600000000n,
        "hash": "0x76e9adc3b5f6262159d49582a64b8696ecf5864ac5237f72b5c0797ca380e9d4",
        "maxFeePerGas": 720000000n,
        "maxPriorityFeePerGas": 0n,
        "nonce": 0n,
        "nonceKey": 0n,
        "signature": {
          "signature": {
            "r": "0x0c5363149ebd9b247cd6948469677efbed1c58be3a79ec020ff767e41196b464",
            "s": "0x701c441f1ce3ca8dd0bff969924db2c8817a7dec1ade02c39c79bd57c8d0089d",
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "transactionIndex": 0,
        "type": "tempo",
      }
    `)
  })

  test('maps `aaAuthorizationList` to `authorizationList`', () => {
    const decoded = z.decode(z_Transaction.Tempo, {
      ...nodeRpc,
      aaAuthorizationList: [
        {
          address: '0xfdc0000000000000000000000000000000000000',
          chainId: '0x539',
          nonce: '0x1',
          signature: {
            r: '0xc5363149ebd9b247cd6948469677efbed1c58be3a79ec020ff767e41196b464',
            s: '0x701c441f1ce3ca8dd0bff969924db2c8817a7dec1ade02c39c79bd57c8d0089d',
            type: 'secp256k1',
            yParity: '0x0',
          },
        },
      ],
    })
    expect(decoded.type === 'tempo' && decoded.authorizationList)
      .toMatchInlineSnapshot(`
      [
        {
          "address": "0xfdc0000000000000000000000000000000000000",
          "chainId": 1337,
          "nonce": 1n,
          "signature": {
            "signature": {
              "r": "0x0c5363149ebd9b247cd6948469677efbed1c58be3a79ec020ff767e41196b464",
              "s": "0x701c441f1ce3ca8dd0bff969924db2c8817a7dec1ade02c39c79bd57c8d0089d",
              "yParity": 0,
            },
            "type": "secp256k1",
          },
        },
      ]
    `)

    const encoded = z.encode(z_Transaction.Tempo, decoded)
    expect(
      'aaAuthorizationList' in encoded && encoded.aaAuthorizationList,
    ).toHaveLength(1)
    expect(encoded).not.toHaveProperty('authorizationList')
  })
})

describe('PendingTempo', () => {
  test('decodes a pending node transaction', () => {
    const decoded = z.decode(z_Transaction.PendingTempo, {
      ...nodeRpc,
      blockHash: null,
      blockNumber: null,
      blockTimestamp: undefined,
      gasPrice: '0x2aea5400',
      transactionIndex: null,
    })
    expect(decoded).toMatchObject({
      blockHash: null,
      blockNumber: null,
      gasPrice: 720000000n,
      transactionIndex: null,
      type: 'tempo',
    })
  })

  test('decodes via the `Pending` union', () => {
    const decoded = z.decode(z_Transaction.Pending, {
      ...nodeRpc,
      blockHash: null,
      blockNumber: null,
      blockTimestamp: undefined,
      transactionIndex: null,
    })
    expect(decoded).toMatchObject({ type: 'tempo' })
  })
})

describe('Transaction', () => {
  test('decodes a tempo transaction via the union', () => {
    const decoded = z.decode(z_Transaction.Transaction, rpc)
    expect(decoded).toMatchObject({ type: 'tempo' })
  })

  test('TempoToRpc accepts numberish encode inputs', () => {
    const decoded = z.decode(z_Transaction.Tempo, rpc)
    const strict = z.encode(z_Transaction.Tempo, decoded)

    expect(
      z.encode(z_Transaction.TempoToRpc, {
        ...decoded,
        chainId: 1,
        gas: 278365,
        maxFeePerGas: 2,
        transactionIndex: 2,
      }),
    ).toEqual(strict)
    expect(
      z.encode(z_Transaction.TempoToRpc, {
        ...decoded,
        chainId: '0x1',
        gas: '0x43f5d',
        maxFeePerGas: '0x2',
      }),
    ).toEqual(strict)
  })

  test('rejects an invalid transaction', () => {
    expect(
      z.safeDecode(z_Transaction.Transaction, { type: '0x76' } as never)
        .success,
    ).toBe(false)
  })
})
