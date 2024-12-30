import { BlockOverrides } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromRpc', () => {
  test('default', () => {
    expect(
      BlockOverrides.fromRpc({
        baseFeePerGas: '0x1',
        blobBaseFee: '0x2',
        feeRecipient: '0x0000000000000000000000000000000000000000',
        gasLimit: '0x4',
        number: '0x5',
        prevRandao: '0x6',
        time: '0x1234567890',
        withdrawals: [
          {
            address: '0x0000000000000000000000000000000000000000',
            amount: '0x1',
            index: '0x0',
            validatorIndex: '0x1',
          },
          {
            address: '0x0000000000000000000000000000000000000000',
            amount: '0x1',
            index: '0x0',
            validatorIndex: '0x1',
          },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "baseFeePerGas": 1n,
        "blobBaseFee": 2n,
        "feeRecipient": "0x0000000000000000000000000000000000000000",
        "gasLimit": 4n,
        "number": 5n,
        "prevRandao": 6n,
        "time": 78187493520n,
        "withdrawals": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": 1n,
            "index": 0,
            "validatorIndex": 1,
          },
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": 1n,
            "index": 0,
            "validatorIndex": 1,
          },
        ],
      }
    `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    expect(
      BlockOverrides.toRpc({
        baseFeePerGas: 1n,
        blobBaseFee: 2n,
        feeRecipient: '0x0000000000000000000000000000000000000000',
        gasLimit: 4n,
        number: 5n,
        prevRandao: 6n,
        time: 78187493520n,
        withdrawals: [
          {
            address: '0x0000000000000000000000000000000000000000',
            amount: 1n,
            index: 0,
            validatorIndex: 1,
          },
          {
            address: '0x0000000000000000000000000000000000000000',
            amount: 1n,
            index: 0,
            validatorIndex: 1,
          },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "baseFeePerGas": "0x1",
        "blobBaseFee": "0x2",
        "feeRecipient": "0x0000000000000000000000000000000000000000",
        "gasLimit": "0x4",
        "number": "0x5",
        "prevRandao": "0x6",
        "time": "0x1234567890",
        "withdrawals": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": "0x1",
            "index": "0x0",
            "validatorIndex": "0x1",
          },
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": "0x1",
            "index": "0x0",
            "validatorIndex": "0x1",
          },
        ],
      }
    `)
  })
})
