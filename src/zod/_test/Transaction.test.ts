import { describe, expect, test } from 'vp/test'
import * as z_Transaction from '../Transaction.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const hash = `0x${'11'.repeat(32)}` as const
const r = `0x${'22'.repeat(32)}` as const
const s = `0x${'33'.repeat(32)}` as const

const baseRpc = {
  blockHash: hash,
  blockNumber: '0x1',
  chainId: '0x1',
  from: address,
  gas: '0x5208',
  hash,
  input: '0xdeadbeef',
  nonce: '0x2',
  r,
  s,
  to: address,
  transactionIndex: '0x0',
  value: '0x3',
  yParity: '0x1',
} as const

const base = {
  blockHash: hash,
  blockNumber: 1n,
  chainId: 1,
  from: address,
  gas: 21000n,
  hash,
  input: '0xdeadbeef',
  nonce: 2n,
  r,
  s,
  to: address,
  transactionIndex: 0,
  value: 3n,
  yParity: 1,
} as const

describe('Transaction', () => {
  test('decodes and encodes EIP-1559 transactions', () => {
    expect(
      z.decode(z_Transaction.Transaction, {
        ...baseRpc,
        accessList: [],
        gasPrice: '0x4',
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        type: '0x2',
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "blockNumber": 1n,
        "chainId": 1,
        "from": "0x0000000000000000000000000000000000000000",
        "gas": 21000n,
        "gasPrice": 4n,
        "hash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "input": "0xdeadbeef",
        "maxFeePerGas": 5n,
        "maxPriorityFeePerGas": 6n,
        "nonce": 2n,
        "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "to": "0x0000000000000000000000000000000000000000",
        "transactionIndex": 0,
        "type": "eip1559",
        "value": 3n,
        "yParity": 1,
      }
    `)
    expect(
      z.encode(z_Transaction.Transaction, {
        ...base,
        accessList: [],
        gasPrice: 4n,
        maxFeePerGas: 5n,
        maxPriorityFeePerGas: 6n,
        type: 'eip1559',
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "blockNumber": "0x1",
        "chainId": "0x1",
        "from": "0x0000000000000000000000000000000000000000",
        "gas": "0x5208",
        "gasPrice": "0x4",
        "hash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "input": "0xdeadbeef",
        "maxFeePerGas": "0x5",
        "maxPriorityFeePerGas": "0x6",
        "nonce": "0x2",
        "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "to": "0x0000000000000000000000000000000000000000",
        "transactionIndex": "0x0",
        "type": "0x2",
        "value": "0x3",
        "yParity": "0x1",
      }
    `)
  })

  test('decodes legacy and pending transactions', () => {
    expect(
      z.decode(z_Transaction.Legacy, {
        ...baseRpc,
        chainId: '0x1',
        gasPrice: '0x4',
        type: '0x0',
        v: '0x1b',
      }),
    ).toMatchObject({ chainId: 1, gasPrice: 4n, type: 'legacy', v: 27 })
    expect(
      z.decode(z_Transaction.Pending, {
        ...baseRpc,
        blockHash: null,
        blockNumber: null,
        gasPrice: '0x4',
        transactionIndex: null,
        type: '0x0',
        v: '0x1b',
      }),
    ).toMatchObject({
      blockHash: null,
      blockNumber: null,
      transactionIndex: null,
      type: 'legacy',
    })
  })

  test('decodes other transaction variants', () => {
    expect(
      z.decode(z_Transaction.Eip2930, {
        ...baseRpc,
        accessList: [],
        gasPrice: '0x4',
        type: '0x1',
      }),
    ).toMatchObject({ gasPrice: 4n, type: 'eip2930' })
    expect(
      z.decode(z_Transaction.Eip4844, {
        ...baseRpc,
        accessList: [],
        blobVersionedHashes: [hash],
        maxFeePerBlobGas: '0x4',
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        type: '0x3',
      }),
    ).toMatchObject({ maxFeePerBlobGas: 4n, type: 'eip4844' })
    expect(
      z.decode(z_Transaction.Eip7702, {
        ...baseRpc,
        accessList: [],
        authorizationList: [
          { address, chainId: '0x1', nonce: '0x2', r, s, yParity: '0x1' },
        ],
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        type: '0x4',
      }),
    ).toMatchObject({
      authorizationList: [{ chainId: 1, nonce: 2n }],
      type: 'eip7702',
    })
    expect(
      z.decode(z_Transaction.Unknown, {
        ...baseRpc,
        type: '0x99',
      }),
    ).toMatchObject({ type: '0x99' })
  })

  test('rejects invalid variants', () => {
    expect(
      z.safeDecode(z_Transaction.Eip1559, {
        ...baseRpc,
        accessList: [],
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        type: '0x1',
      } as never).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_Transaction.Transaction, {
        ...baseRpc,
        type: '0x2',
      } as never).success,
    ).toBe(false)
  })
})
