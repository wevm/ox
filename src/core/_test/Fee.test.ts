import { Fee } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromHistoryRpc / toHistoryRpc', () => {
  test('round-trips', () => {
    const rpc = {
      baseFeePerGas: ['0x1', '0x2'] as `0x${string}`[],
      gasUsedRatio: [0.5, 0.6],
      oldestBlock: '0x10' as `0x${string}`,
      reward: [['0x1' as `0x${string}`]],
    }
    expect(Fee.fromHistoryRpc(rpc)).toEqual({
      baseFeePerGas: [1n, 2n],
      gasUsedRatio: [0.5, 0.6],
      oldestBlock: 16n,
      reward: [[1n]],
    })
    expect(Fee.toHistoryRpc(Fee.fromHistoryRpc(rpc))).toEqual(rpc)
  })

  test('omits `reward` when not present', () => {
    expect(
      Fee.fromHistoryRpc({
        baseFeePerGas: ['0x01'],
        gasUsedRatio: [0.5],
        oldestBlock: '0x10',
      }),
    ).toEqual({
      baseFeePerGas: [1n],
      gasUsedRatio: [0.5],
      oldestBlock: 16n,
    })
  })
})

describe('estimateMaxFeePerGas', () => {
  test('default 2x multiplier', () => {
    expect(
      Fee.estimateMaxFeePerGas({
        baseFeePerGas: 100n,
        maxPriorityFeePerGas: 5n,
      }),
    ).toBe(205n)
  })

  test('custom 1.5x multiplier', () => {
    expect(
      Fee.estimateMaxFeePerGas({
        baseFeePerGas: 100n,
        maxPriorityFeePerGas: 5n,
        multiplierNumerator: 3n,
        multiplierDenominator: 2n,
      }),
    ).toBe(155n)
  })
})

describe('effectiveGasPrice', () => {
  test('uses base+tip when within cap', () => {
    expect(
      Fee.effectiveGasPrice({
        baseFeePerGas: 100n,
        maxFeePerGas: 200n,
        maxPriorityFeePerGas: 50n,
      }),
    ).toBe(150n)
  })

  test('caps at maxFeePerGas when base+tip exceeds it', () => {
    expect(
      Fee.effectiveGasPrice({
        baseFeePerGas: 100n,
        maxFeePerGas: 120n,
        maxPriorityFeePerGas: 50n,
      }),
    ).toBe(120n)
  })
})

test('exports', () => {
  expect(Object.keys(Fee)).toMatchInlineSnapshot(`
    [
      "fromHistoryRpc",
      "toHistoryRpc",
      "estimateMaxFeePerGas",
      "effectiveGasPrice",
    ]
  `)
})
