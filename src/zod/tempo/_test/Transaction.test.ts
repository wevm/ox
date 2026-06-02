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
})

describe('Transaction', () => {
  test('decodes a tempo transaction via the union', () => {
    const decoded = z.decode(z_Transaction.Transaction, rpc)
    expect(decoded).toMatchObject({ type: 'tempo' })
  })

  test('rejects an invalid transaction', () => {
    expect(
      z.safeDecode(z_Transaction.Transaction, { type: '0x76' } as never)
        .success,
    ).toBe(false)
  })
})
