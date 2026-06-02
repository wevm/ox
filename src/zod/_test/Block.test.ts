import { describe, expect, test } from 'vp/test'
import * as z_Block from '../Block.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const hash = `0x${'11'.repeat(32)}` as const
const hash2 = `0x${'22'.repeat(32)}` as const
const r = `0x${'33'.repeat(32)}` as const
const s = `0x${'44'.repeat(32)}` as const

const blockRpc = {
  baseFeePerGas: '0x1',
  blobGasUsed: '0x2',
  difficulty: '0x3',
  excessBlobGas: '0x4',
  extraData: '0x',
  gasLimit: '0x5',
  gasUsed: '0x6',
  hash,
  logsBloom: '0x',
  miner: address,
  mixHash: hash,
  nonce: '0x0000000000000000',
  number: '0x7',
  parentBeaconBlockRoot: hash,
  parentHash: hash,
  receiptsRoot: hash,
  sealFields: [hash, '0x0000000000000000'],
  sha3Uncles: hash,
  size: '0x8',
  stateRoot: hash,
  timestamp: '0x9',
  totalDifficulty: '0xa',
  transactions: [hash2],
  transactionsRoot: hash,
  uncles: [hash2],
  withdrawals: [
    { address, amount: '0xb', index: '0xc', validatorIndex: '0xd' },
  ],
  withdrawalsRoot: hash,
} as const

describe('Block', () => {
  test('decodes and encodes blocks with transaction hashes', () => {
    expect(z.decode(z_Block.Block, blockRpc)).toMatchInlineSnapshot(`
      {
        "baseFeePerGas": 1n,
        "blobGasUsed": 2n,
        "difficulty": 3n,
        "excessBlobGas": 4n,
        "extraData": "0x",
        "gasLimit": 5n,
        "gasUsed": 6n,
        "hash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "logsBloom": "0x",
        "miner": "0x0000000000000000000000000000000000000000",
        "mixHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "nonce": "0x0000000000000000",
        "number": 7n,
        "parentBeaconBlockRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "parentHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "receiptsRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "sealFields": [
          "0x1111111111111111111111111111111111111111111111111111111111111111",
          "0x0000000000000000",
        ],
        "sha3Uncles": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "size": 8n,
        "stateRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "timestamp": 9n,
        "totalDifficulty": 10n,
        "transactions": [
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        ],
        "transactionsRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "uncles": [
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        ],
        "withdrawals": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": 11n,
            "index": 12,
            "validatorIndex": 13,
          },
        ],
        "withdrawalsRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
      }
    `)
    expect(
      z.encode(z_Block.Block, {
        baseFeePerGas: 1n,
        blobGasUsed: 2n,
        difficulty: 3n,
        excessBlobGas: 4n,
        extraData: '0x',
        gasLimit: 5n,
        gasUsed: 6n,
        hash,
        logsBloom: '0x',
        miner: address,
        mixHash: hash,
        nonce: '0x0000000000000000',
        number: 7n,
        parentBeaconBlockRoot: hash,
        parentHash: hash,
        receiptsRoot: hash,
        sealFields: [hash, '0x0000000000000000'],
        sha3Uncles: hash,
        size: 8n,
        stateRoot: hash,
        timestamp: 9n,
        totalDifficulty: 10n,
        transactions: [hash2],
        transactionsRoot: hash,
        uncles: [hash2],
        withdrawals: [{ address, amount: 11n, index: 12, validatorIndex: 13 }],
        withdrawalsRoot: hash,
      }),
    ).toMatchInlineSnapshot(`
      {
        "baseFeePerGas": "0x1",
        "blobGasUsed": "0x2",
        "difficulty": "0x3",
        "excessBlobGas": "0x4",
        "extraData": "0x",
        "gasLimit": "0x5",
        "gasUsed": "0x6",
        "hash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "logsBloom": "0x",
        "miner": "0x0000000000000000000000000000000000000000",
        "mixHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "nonce": "0x0000000000000000",
        "number": "0x7",
        "parentBeaconBlockRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "parentHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "receiptsRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "sealFields": [
          "0x1111111111111111111111111111111111111111111111111111111111111111",
          "0x0000000000000000",
        ],
        "sha3Uncles": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "size": "0x8",
        "stateRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "timestamp": "0x9",
        "totalDifficulty": "0xa",
        "transactions": [
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        ],
        "transactionsRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "uncles": [
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        ],
        "withdrawals": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": "0xb",
            "index": "0xc",
            "validatorIndex": "0xd",
          },
        ],
        "withdrawalsRoot": "0x1111111111111111111111111111111111111111111111111111111111111111",
      }
    `)
  })

  test('decodes blocks with full transactions and pending blocks', () => {
    const transaction = {
      accessList: [],
      blockHash: hash,
      blockNumber: '0x7',
      chainId: '0x1',
      from: address,
      gas: '0x5208',
      hash,
      input: '0x',
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x1',
      nonce: '0x0',
      r,
      s,
      to: address,
      transactionIndex: '0x0',
      type: '0x2',
      value: '0x0',
      yParity: '0x1',
    } as const

    expect(
      z.decode(z_Block.WithTransactions, {
        ...blockRpc,
        transactions: [transaction],
      }),
    ).toMatchObject({ transactions: [{ type: 'eip1559' }] })
    expect(
      z.decode(z_Block.Pending, {
        ...blockRpc,
        hash: null,
        logsBloom: null,
        nonce: null,
        number: null,
      }),
    ).toMatchObject({ hash: null, number: null })
  })

  test('decodes identifiers and rejects invalid blocks', () => {
    expect(
      z.decode(z_Block.Identifier, {
        blockNumber: '0x1',
        requireCanonical: true,
      }),
    ).toMatchInlineSnapshot(`
      {
        "blockNumber": 1n,
        "requireCanonical": true,
      }
    `)
    expect(
      z.safeDecode(z_Block.Identifier, {
        blockHash: hash,
        blockNumber: '0x1',
      } as never).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_Block.Block, {
        ...blockRpc,
        gasLimit: '0x',
      } as never).success,
    ).toBe(false)
  })
})
