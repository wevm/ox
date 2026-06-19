import { describe, expect, test } from 'vp/test'
import * as z_BlockOverrides from '../BlockOverrides.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'

describe('BlockOverrides', () => {
  test('decodes and encodes block overrides', () => {
    expect(
      z.decode(z_BlockOverrides.BlockOverrides, {
        baseFeePerGas: '0x1',
        blobBaseFee: '0x2',
        feeRecipient: address,
        gasLimit: '0x3',
        number: '0x4',
        prevRandao: '0x5',
        time: '0x6',
        withdrawals: [
          {
            address,
            amount: '0x7',
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
        "gasLimit": 3n,
        "number": 4n,
        "prevRandao": 5n,
        "time": 6n,
        "withdrawals": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": 7n,
            "index": 0,
            "validatorIndex": 1,
          },
        ],
      }
    `)
    expect(
      z.encode(z_BlockOverrides.BlockOverrides, {
        baseFeePerGas: 1n,
        blobBaseFee: 2n,
        feeRecipient: address,
        gasLimit: 3n,
        number: 4n,
        prevRandao: 5n,
        time: 6n,
        withdrawals: [
          {
            address,
            amount: 7n,
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
        "gasLimit": "0x3",
        "number": "0x4",
        "prevRandao": "0x5",
        "time": "0x6",
        "withdrawals": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "amount": "0x7",
            "index": "0x0",
            "validatorIndex": "0x1",
          },
        ],
      }
    `)
  })

  test('BlockOverridesToRpc accepts numberish encode inputs', () => {
    const decoded = {
      baseFeePerGas: 1n,
      blobBaseFee: 2n,
      feeRecipient: address,
      gasLimit: 3n,
      number: 4n,
      prevRandao: 5n,
      time: 6n,
      withdrawals: [{ address, amount: 7n, index: 0, validatorIndex: 1 }],
    } as const
    const expected = z.encode(z_BlockOverrides.BlockOverrides, {
      ...decoded,
      withdrawals: [{ address, amount: 7n, index: 0, validatorIndex: 1 }],
    })

    expect(
      z.encode(z_BlockOverrides.BlockOverridesToRpc, {
        ...decoded,
        baseFeePerGas: 1,
        gasLimit: 3,
        time: 6,
        withdrawals: [{ address, amount: 7, index: 0, validatorIndex: 1 }],
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_BlockOverrides.BlockOverridesToRpc, {
        ...decoded,
        baseFeePerGas: '0x1',
        number: '0x4',
        withdrawals: [{ address, amount: '0x7', index: 0, validatorIndex: 1 }],
      }),
    ).toEqual(expected)
  })

  test('rejects invalid nested withdrawals', () => {
    expect(
      z.safeDecode(z_BlockOverrides.BlockOverrides, {
        withdrawals: [
          {
            address: '0xdeadbeef',
            amount: '0x7',
            index: '0x0',
            validatorIndex: '0x1',
          },
        ],
      }).success,
    ).toBe(false)
  })
})
