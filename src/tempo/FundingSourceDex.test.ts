import { describe, expect, test } from 'vp/test'
import * as FundingSourceDex from './FundingSourceDex.js'

const token = '0x0101010101010101010101010101010101010101' as const

describe('from', () => {
  test('creates a funding source with the native DEX address', () => {
    expect(FundingSourceDex.from({ tokenIn: token, maxAmountIn: 30n })).toEqual(
      {
        data: '0x0000000000000000000000000101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000000000000001e',
        to: '0x1120000000000000000000000000000000000001',
      },
    )
  })
})

describe('encode', () => {
  test('preserves zero and defaults to unlimited input', () => {
    expect(
      FundingSourceDex.decode(FundingSourceDex.encode({ tokenIn: token })),
    ).toEqual({ tokenIn: token, maxAmountIn: 2n ** 256n - 1n })
    expect(
      FundingSourceDex.decode(
        FundingSourceDex.encode({ tokenIn: token, maxAmountIn: 0n }),
      ),
    ).toEqual({ tokenIn: token, maxAmountIn: 0n })
  })
})
