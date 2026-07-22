import { EarnShares } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const anchor = { engineShares: 3n, shareSupply: 2n } as const

describe('toAmount', () => {
  test('default', () => {
    expect(EarnShares.toAmount(anchor, 7n)).toBe(4n)
  })

  test('behavior: rounds down', () => {
    expect(EarnShares.toAmount({ engineShares: 3n, shareSupply: 1n }, 2n)).toBe(
      0n,
    )
  })
})

describe('toAmountUp', () => {
  test('default', () => {
    expect(EarnShares.toAmountUp(anchor, 7n)).toBe(5n)
  })

  test('behavior: exact conversions do not round up', () => {
    expect(EarnShares.toAmountUp(anchor, 3n)).toBe(2n)
  })
})

describe('toVenueAmount', () => {
  test('default', () => {
    expect(EarnShares.toVenueAmount(anchor, 7n)).toBe(10n)
  })

  test('behavior: identity at the initial 1:1 anchor', () => {
    expect(
      EarnShares.toVenueAmount({ engineShares: 1n, shareSupply: 1n }, 12_345n),
    ).toBe(12_345n)
  })
})

describe('feeShares', () => {
  test('default', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 1_100n,
        shareSupply: 1_000n,
        totalFeeAssets: 100n,
      }),
    ).toBe(100n)
  })

  test('behavior: zero fee mints nothing', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 1_100n,
        shareSupply: 1_000n,
        totalFeeAssets: 0n,
      }),
    ).toBe(0n)
  })

  test('behavior: fee at or above active assets mints nothing', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 100n,
        shareSupply: 1_000n,
        totalFeeAssets: 100n,
      }),
    ).toBe(0n)
  })

  test('behavior: rounds down', () => {
    expect(
      EarnShares.feeShares({
        activeAssets: 1_000n,
        shareSupply: 999n,
        totalFeeAssets: 100n,
      }),
    ).toBe(111n)
  })
})

describe('minimumOutput', () => {
  test('default', () => {
    expect(EarnShares.minimumOutput(1_000_000n, 50)).toBe(995_000n)
  })

  test('behavior: zero slippage returns the expected output', () => {
    expect(EarnShares.minimumOutput(1_000_000n, 0)).toBe(1_000_000n)
  })

  test('behavior: floors to 1n', () => {
    expect(EarnShares.minimumOutput(1n, 9_999)).toBe(1n)
  })

  test('error: non-positive expected output', () => {
    expect(() =>
      EarnShares.minimumOutput(0n, 50),
    ).toThrowErrorMatchingInlineSnapshot(
      `[EarnShares.InvalidExpectedOutputError: Expected output \`0\` must be greater than zero.]`,
    )
  })

  test('error: out-of-range slippage', () => {
    expect(() =>
      EarnShares.minimumOutput(1_000_000n, 10_000),
    ).toThrowErrorMatchingInlineSnapshot(`
      [EarnShares.InvalidSlippageError: Slippage tolerance \`10000\` is invalid.

      Slippage must be a whole number from 0 through 9999 basis points.]
    `)
  })

  test('error: non-integer slippage', () => {
    expect(() =>
      EarnShares.minimumOutput(1_000_000n, 0.5),
    ).toThrowErrorMatchingInlineSnapshot(`
      [EarnShares.InvalidSlippageError: Slippage tolerance \`0.5\` is invalid.

      Slippage must be a whole number from 0 through 9999 basis points.]
    `)
  })
})
