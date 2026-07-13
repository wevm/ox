import { describe, expect, test } from 'vp/test'
import * as z_Fee from '../Fee.js'
import * as z from 'zod/mini'

describe('Fee', () => {
  test('decodes and encodes fee history', () => {
    const history: z.input<typeof z_Fee.FeeHistory> = {
      baseFeePerGas: ['0x1', '0x2'],
      gasUsedRatio: [0.5, 0.6],
      oldestBlock: '0x10',
      reward: [['0x3']],
    }

    expect(z.decode(z_Fee.FeeHistory, history)).toMatchInlineSnapshot(`
      {
        "baseFeePerGas": [
          1n,
          2n,
        ],
        "gasUsedRatio": [
          0.5,
          0.6,
        ],
        "oldestBlock": 16n,
        "reward": [
          [
            3n,
          ],
        ],
      }
    `)
    expect(
      z.encode(z_Fee.FeeHistory, {
        baseFeePerGas: [1n, 2n],
        gasUsedRatio: [0.5, 0.6],
        oldestBlock: 16n,
        reward: [[3n]],
      }),
    ).toMatchInlineSnapshot(`
      {
        "baseFeePerGas": [
          "0x1",
          "0x2",
        ],
        "gasUsedRatio": [
          0.5,
          0.6,
        ],
        "oldestBlock": "0x10",
        "reward": [
          [
            "0x3",
          ],
        ],
      }
    `)
  })

  test('decodes fee values', () => {
    expect(z.decode(z_Fee.FeeValuesLegacy, { gasPrice: '0x1' }))
      .toMatchInlineSnapshot(`
        {
          "gasPrice": 1n,
        }
      `)
    expect(
      z.decode(z_Fee.FeeValuesEip1559, {
        maxFeePerGas: '0x2',
        maxPriorityFeePerGas: '0x1',
      }),
    ).toMatchInlineSnapshot(`
      {
        "maxFeePerGas": 2n,
        "maxPriorityFeePerGas": 1n,
      }
    `)
    expect(
      z.decode(z_Fee.FeeValues, {
        maxFeePerBlobGas: '0x3',
        maxFeePerGas: '0x2',
        maxPriorityFeePerGas: '0x1',
      }),
    ).toMatchInlineSnapshot(`
      {
        "maxFeePerBlobGas": 3n,
        "maxFeePerGas": 2n,
        "maxPriorityFeePerGas": 1n,
      }
    `)
  })
})
