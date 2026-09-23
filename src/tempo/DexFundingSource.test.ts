import { describe, expect, test } from 'vitest'
import * as DexFundingSource from './DexFundingSource.js'

const token = '0x0101010101010101010101010101010101010101' as const
describe('encode', () => {
  test('preserves zero and defaults to unlimited input', () => {
    expect(
      DexFundingSource.decode(DexFundingSource.encode({ tokenIn: token })),
    ).toEqual({ tokenIn: token, maxAmountIn: 2n ** 256n - 1n })
    expect(
      DexFundingSource.decode(
        DexFundingSource.encode({ tokenIn: token, maxAmountIn: 0n }),
      ),
    ).toEqual({ tokenIn: token, maxAmountIn: 0n })
  })
})
