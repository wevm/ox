import { describe, expect, test } from 'vitest'
import * as NativeDexFunding from './NativeDexFunding.js'

const token = '0x0101010101010101010101010101010101010101' as const
describe('encode', () => {
  test('preserves zero and defaults to unlimited input', () => {
    expect(
      NativeDexFunding.decode(NativeDexFunding.encode({ tokenIn: token })),
    ).toEqual({ tokenIn: token, maxAmountIn: 2n ** 256n - 1n })
    expect(
      NativeDexFunding.decode(
        NativeDexFunding.encode({ tokenIn: token, maxAmountIn: 0n }),
      ),
    ).toEqual({ tokenIn: token, maxAmountIn: 0n })
  })
})
