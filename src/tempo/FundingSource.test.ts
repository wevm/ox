import { describe, expect, test } from 'vp/test'
import * as FundingSource from './FundingSource.js'

const token = '0x0101010101010101010101010101010101010101' as const

describe('dex', () => {
  test('creates a funding source with the native DEX address', () => {
    expect(FundingSource.dex({ tokenIn: token, maxAmountIn: 30n })).toEqual({
      data: '0x0000000000000000000000000101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000000000000001e',
      to: '0x1120000000000000000000000000000000000001',
    })
  })
})

describe('encodeExecutionData', () => {
  test('preserves zero and defaults to unlimited input', () => {
    expect(
      FundingSource.decode(
        FundingSource.encodeExecutionData({ tokenIn: token }),
      ),
    ).toEqual({ tokenIn: token, maxAmountIn: 2n ** 256n - 1n })
    expect(
      FundingSource.decode(
        FundingSource.encodeExecutionData({ tokenIn: token, maxAmountIn: 0n }),
      ),
    ).toEqual({ tokenIn: token, maxAmountIn: 0n })
  })
})

describe('encodeConfigData', () => {
  test('encodes an approved input and cap', () => {
    expect(
      FundingSource.encodeConfigData({ maxAmountIn: 30n, tokenIn: token }),
    ).toBe(
      '0x0000000000000000000000000101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000000000000001e',
    )
  })

  test('preserves zero and defaults to unlimited input', () => {
    expect(
      FundingSource.decode(FundingSource.encodeConfigData({ tokenIn: token })),
    ).toEqual({ maxAmountIn: 2n ** 256n - 1n, tokenIn: token })
    expect(
      FundingSource.decode(
        FundingSource.encodeConfigData({ maxAmountIn: 0n, tokenIn: token }),
      ),
    ).toEqual({ maxAmountIn: 0n, tokenIn: token })
  })
})
