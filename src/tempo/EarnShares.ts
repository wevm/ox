import * as Errors from '../core/Errors.js'

/** Basis-point denominator used by slippage bounds. */
export const basisPointScale = 10_000n

/**
 * Tempo Earn `VaultAdapter` conversion anchor.
 *
 * The adapter prices EarnToken against venue shares through this pair:
 * `engineShares` venue shares are worth `supply` EarnToken. It is initialised
 * 1:1 and restated on `contribute` and `migrateEngine`.
 *
 * Adapter vocabulary applies throughout this module: "tokens" are EarnToken
 * (TIP-20) units and "shares" are venue shares. These conversions are raw and
 * fee-blind; they ignore pending fee dilution and are unsuitable for
 * user-facing value (use the adapter's `previewRedeem`).
 */
export type Anchor = {
  /** Venue shares held by the engine at the anchor point. */
  engineShares: bigint
  /** EarnToken (TIP-20) supply at the anchor point. */
  supply: bigint
}

/**
 * Converts EarnToken units to venue shares at the anchor rate, rounding down.
 *
 * Mirrors `VaultAdapter.tokensToShares`.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const shares = EarnShares.fromTokens(
 *   { engineShares: 3n, supply: 2n },
 *   7n,
 * )
 * // @log: 10n
 * ```
 *
 * @param anchor - The conversion anchor.
 * @param tokens - EarnToken amount, base units.
 * @returns Venue shares, rounded down.
 */
export function fromTokens(anchor: Anchor, tokens: bigint): bigint {
  return (tokens * anchor.engineShares) / anchor.supply
}

export declare namespace fromTokens {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts venue shares to EarnToken units at the anchor rate, rounding down.
 *
 * Mirrors `VaultAdapter.sharesToTokens`.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const tokens = EarnShares.toTokens(
 *   { engineShares: 3n, supply: 2n },
 *   7n,
 * )
 * // @log: 4n
 * ```
 *
 * @param anchor - The conversion anchor.
 * @param shares - Venue share amount, base units.
 * @returns EarnToken units, rounded down.
 */
export function toTokens(anchor: Anchor, shares: bigint): bigint {
  return (shares * anchor.supply) / anchor.engineShares
}

export declare namespace toTokens {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts venue shares to EarnToken units at the anchor rate, rounding up.
 *
 * Mirrors the adapter's ceiling conversion used by exact-asset exits.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const tokens = EarnShares.toTokensUp(
 *   { engineShares: 3n, supply: 2n },
 *   7n,
 * )
 * // @log: 5n
 * ```
 *
 * @param anchor - The conversion anchor.
 * @param shares - Venue share amount, base units.
 * @returns EarnToken units, rounded up.
 */
export function toTokensUp(anchor: Anchor, shares: bigint): bigint {
  const { engineShares, supply } = anchor
  return (shares * supply + engineShares - 1n) / engineShares
}

export declare namespace toTokensUp {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Computes the dilution-correct EarnToken minted for an asset-denominated fee.
 *
 * Mirrors `FeeMath`: `feeShares = floor(fee * supply / (activeAssets - fee))`,
 * zero when the fee is zero or not smaller than the active assets. Minting this
 * amount to the fee ledger prices the fee at post-mint value per share.
 *
 * @example
 * ```ts twoslash
 * import { EarnShares } from 'ox/tempo'
 *
 * const shares = EarnShares.feeShares({
 *   activeAssets: 1_100n,
 *   supply: 1_000n,
 *   totalFeeAssets: 100n,
 * })
 * // @log: 100n
 * ```
 *
 * @param options - Fee accrual inputs.
 * @returns EarnToken to mint for the fee, rounded down.
 */
export function feeShares(options: feeShares.Options): bigint {
  const { activeAssets, supply, totalFeeAssets } = options
  if (totalFeeAssets === 0n || totalFeeAssets >= activeAssets) return 0n
  return (totalFeeAssets * supply) / (activeAssets - totalFeeAssets)
}

export declare namespace feeShares {
  export type Options = {
    /** Assets backing the active (non-queued) supply, base units. */
    activeAssets: bigint
    /** Active EarnToken supply, base units. */
    supply: bigint
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
 * const minimumShares = EarnShares.minimumOutput(1_000_000n, 50n)
 * // @log: 995_000n
 * ```
 *
 * @param expected - Expected output in base units.
 * @param slippageBps - Allowed slippage in basis points from `0n` through `9_999n`.
 * @returns The minimum accepted output, floored to `1n`.
 * @throws `InvalidExpectedOutputError` when `expected` is not positive.
 * @throws `InvalidSlippageError` when `slippageBps` is outside its valid range.
 */
export function minimumOutput(expected: bigint, slippageBps: bigint): bigint {
  if (expected <= 0n) throw new InvalidExpectedOutputError({ expected })
  if (slippageBps < 0n || slippageBps >= basisPointScale)
    throw new InvalidSlippageError({ slippageBps })
  const bounded = (expected * (basisPointScale - slippageBps)) / basisPointScale
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
    super(`Expected output \`${options.expected}\` must be greater than zero.`)
  }
}

export declare namespace InvalidExpectedOutputError {
  export type Options = {
    expected: bigint
  }
}

/**
 * Error thrown when a slippage tolerance is outside `0n` through `9_999n`.
 */
export class InvalidSlippageError extends Errors.BaseError {
  override readonly name = 'EarnShares.InvalidSlippageError'

  constructor(options: InvalidSlippageError.Options) {
    super(`Slippage tolerance \`${options.slippageBps}\` is invalid.`, {
      metaMessages: [
        `Slippage must be at least 0 and below ${basisPointScale} basis points.`,
      ],
    })
  }
}

export declare namespace InvalidSlippageError {
  export type Options = {
    slippageBps: bigint
  }
}
