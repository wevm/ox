import { describe, expect, test } from 'vitest'
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
