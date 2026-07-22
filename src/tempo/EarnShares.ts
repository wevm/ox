import * as Errors from '../core/Errors.js'

/** Basis-point denominator used by slippage bounds. */
export const basisPointScale = 10_000

/**
 * Tempo Earn `VaultAdapter` conversion anchor.
 *
 * The adapter prices vault shares against venue shares through this pair:
 * `engineShares` venue shares are worth `shareSupply` vault shares. It is initialised
 * 1:1 and restated on `contribute` and `migrateEngine`.
 *
 * These conversions are raw and fee-blind; they ignore pending fee dilution
 * and are unsuitable for user-facing value (use the adapter's `previewRedeem`).
 */
export type Anchor = {
  /** Venue shares held by the engine at the anchor point. */
  engineShares: bigint
  /** Vault share supply at the anchor point. */
  shareSupply: bigint
}

/**
 * Converts venue shares to a vault share amount at the anchor rate, rounding down.
 *
 * Mirrors `VaultAdapter.sharesToTokens`.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const shareAmount = EarnShares.toAmount(
 *   { engineShares: 3n, shareSupply: 2n },
 *   7n,
 * )
 * // @log: 4n
 * ```
 *
 * @param anchor - The conversion anchor.
 * @param venueShareAmount - Venue share amount, base units.
 * @returns Vault share amount, rounded down.
 */
export function toAmount(anchor: Anchor, venueShareAmount: bigint): bigint {
  return (venueShareAmount * anchor.shareSupply) / anchor.engineShares
}

export declare namespace toAmount {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts venue shares to a vault share amount at the anchor rate, rounding up.
 *
 * Mirrors the adapter's ceiling conversion used by exact-asset exits.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const shareAmount = EarnShares.toAmountUp(
 *   { engineShares: 3n, shareSupply: 2n },
 *   7n,
 * )
 * // @log: 5n
 * ```
 *
 * @param anchor - The conversion anchor.
 * @param venueShareAmount - Venue share amount, base units.
 * @returns Vault share amount, rounded up.
 */
export function toAmountUp(anchor: Anchor, venueShareAmount: bigint): bigint {
  const { engineShares, shareSupply } = anchor
  return (venueShareAmount * shareSupply + engineShares - 1n) / engineShares
}

export declare namespace toAmountUp {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a vault share amount to venue shares at the anchor rate, rounding down.
 *
 * Mirrors `VaultAdapter.tokensToShares`.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const venueShareAmount = EarnShares.toVenueAmount(
 *   { engineShares: 3n, shareSupply: 2n },
 *   7n,
 * )
 * // @log: 10n
 * ```
 *
 * @param anchor - The conversion anchor.
 * @param shareAmount - Vault share amount, base units.
 * @returns Venue share amount, rounded down.
 */
export function toVenueAmount(anchor: Anchor, shareAmount: bigint): bigint {
  return (shareAmount * anchor.engineShares) / anchor.shareSupply
}

export declare namespace toVenueAmount {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Computes the dilution-correct vault shares minted for an asset-denominated fee.
 *
 * Mirrors `FeeMath`:
 * `feeShares = floor(fee * shareSupply / (activeAssets - fee))`, zero when the
 * fee is zero or not smaller than the active assets. Minting this amount to the
 * fee ledger prices the fee at post-mint value per share.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const shares = EarnShares.feeShares({
 *   activeAssets: 1_100n,
 *   shareSupply: 1_000n,
 *   totalFeeAssets: 100n,
 * })
 * // @log: 100n
 * ```
 *
 * @param options - Fee accrual inputs.
 * @returns Vault shares to mint for the fee, rounded down.
 */
export function feeShares(options: feeShares.Options): bigint {
  const { activeAssets, shareSupply, totalFeeAssets } = options
  if (totalFeeAssets === 0n || totalFeeAssets >= activeAssets) return 0n
  return (totalFeeAssets * shareSupply) / (activeAssets - totalFeeAssets)
}

export declare namespace feeShares {
  export type Options = {
    /** Assets backing the active (non-queued) supply, base units. */
    activeAssets: bigint
    /** Active vault share supply, base units. */
    shareSupply: bigint
    /** Total fee liability in asset units. */
    totalFeeAssets: bigint
  }
  export type ErrorType = Errors.GlobalErrorType
}

/**
 * Lowers an expected output by a basis-point slippage tolerance, flooring to `1n`.
 *
 * Suitable for lower bounds such as a deposit's minimum shares or a redeem's
 * minimum assets; not for upper bounds such as an exact withdrawal's maximum
 * shares.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const minimumShares = EarnShares.minimumOutput(1_000_000n, 50)
 * // @log: 995_000n
 * ```
 *
 * @param expectedAmount - Expected output in base units.
 * @param slippageBps - Allowed slippage in basis points from `0` through `9_999`.
 * @returns The minimum accepted output, floored to `1n`.
 * @throws `InvalidExpectedOutputError` when `expectedAmount` is not positive.
 * @throws `InvalidSlippageError` when `slippageBps` is outside its valid range.
 */
export function minimumOutput(
  expectedAmount: bigint,
  slippageBps: number,
): bigint {
  if (expectedAmount <= 0n)
    throw new InvalidExpectedOutputError({ expectedAmount })
  if (
    !Number.isInteger(slippageBps) ||
    slippageBps < 0 ||
    slippageBps >= basisPointScale
  )
    throw new InvalidSlippageError({ slippageBps })
  const scale = BigInt(basisPointScale)
  const bounded = (expectedAmount * (scale - BigInt(slippageBps))) / scale
  return bounded === 0n ? 1n : bounded
}

export declare namespace minimumOutput {
  type ErrorType =
    | InvalidExpectedOutputError
    | InvalidSlippageError
    | Errors.GlobalErrorType
}

/**
 * Error thrown when an expected output is not positive.
 */
export class InvalidExpectedOutputError extends Errors.BaseError {
  override readonly name = 'EarnShares.InvalidExpectedOutputError'

  constructor(options: InvalidExpectedOutputError.Options) {
    super(
      `Expected output \`${options.expectedAmount}\` must be greater than zero.`,
    )
  }
}

export declare namespace InvalidExpectedOutputError {
  export type Options = {
    expectedAmount: bigint
  }
}

/**
 * Error thrown when a slippage tolerance is not an integer from `0` through `9_999`.
 */
export class InvalidSlippageError extends Errors.BaseError {
  override readonly name = 'EarnShares.InvalidSlippageError'

  constructor(options: InvalidSlippageError.Options) {
    super(`Slippage tolerance \`${options.slippageBps}\` is invalid.`, {
      metaMessages: [
        `Slippage must be a whole number from 0 through ${basisPointScale - 1} basis points.`,
      ],
    })
  }
}

export declare namespace InvalidSlippageError {
  export type Options = {
    slippageBps: number
  }
}
