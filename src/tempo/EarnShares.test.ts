import { EarnShares } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const anchor = { engineShares: 3n, supply: 2n } as const

describe('fromTokens', () => {
  test('default', () => {
    expect(EarnShares.fromTokens(anchor, 7n)).toBe(10n)
  })

  test('behavior: identity at the initial 1:1 anchor', () => {
    expect(
      EarnShares.fromTokens({ engineShares: 1n, supply: 1n }, 12_345n),
    ).toBe(12_345n)
  })
})

describe('toTokens', () => {
  test('default', () => {
    expect(EarnShares.toTokens(anchor, 7n)).toBe(4n)
  })

  test('behavior: rounds down', () => {
    expect(EarnShares.toTokens({ engineShares: 3n, supply: 1n }, 2n)).toBe(0n)
  })
})

describe('toTokensUp', () => {
  test('default', () => {
    expect(EarnShares.toTokensUp(anchor, 7n)).toBe(5n)
  })

  test('behavior: exact conversions do not round up', () => {
    expect(EarnShares.toTokensUp(anchor, 3n)).toBe(2n)
  })
})

describe('feeShares', () => {
  test('default', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 1_100n,
        supply: 1_000n,
        totalFeeAssets: 100n,
      }),
    ).toBe(100n)
  })

  test('behavior: zero fee mints nothing', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 1_100n,
        supply: 1_000n,
        totalFeeAssets: 0n,
      }),
    ).toBe(0n)
  })

  test('behavior: fee at or above active assets mints nothing', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 100n,
        supply: 1_000n,
        totalFeeAssets: 100n,
      }),
    ).toBe(0n)
  })

  test('behavior: rounds down', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 1_000n,
        supply: 999n,
        totalFeeAssets: 100n,
      }),
    ).toBe(111n)
  })
})

describe('minimumOutput', () => {
  test('default', () => {
    expect(EarnShares.minimumOutput(1_000_000n, 50n)).toBe(995_000n)
  })

  test('behavior: zero slippage returns the expected output', () => {
    expect(EarnShares.minimumOutput(1_000_000n, 0n)).toBe(1_000_000n)
  })

  test('behavior: floors to 1n', () => {
    expect(EarnShares.minimumOutput(1n, 9_999n)).toBe(1n)
  })

  test('error: non-positive expected output', () => {
    expect(() =>
      EarnShares.minimumOutput(0n, 50n),
    ).toThrowErrorMatchingInlineSnapshot(
      `[EarnShares.InvalidExpectedOutputError: Expected output \`0\` must be greater than zero.]`,
    )
  })

  test('error: out-of-range slippage', () => {
    expect(() =>
      EarnShares.minimumOutput(1_000_000n, 10_000n),
    ).toThrowErrorMatchingInlineSnapshot(`
      [EarnShares.InvalidSlippageError: Slippage tolerance \`10000\` is invalid.

      Slippage must be at least 0 and below 10000 basis points.]
    `)
  })
})
