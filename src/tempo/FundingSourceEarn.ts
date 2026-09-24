import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

/** Earn execution arguments or source configuration. */
export type Request = {
  /** EarnShare input cap in base units. Omission is unlimited; zero permits no input. */
  maxAmountIn?: bigint | undefined
  /** Gross underlying-token value cap in base units, before exit fees. Omission is unlimited; zero permits no input. */
  maxValueIn?: bigint | undefined
  /** Earn vault whose shares are redeemed. */
  vault: Address.Address
}

const parameters = AbiParameters.from(
  'address vault, uint256 maxAmountIn, uint256 maxValueIn',
)

/**
 * Encodes an Earn funding request as `executionData`.
 *
 * Caps apply per source invocation. `maxValueIn` uses underlying-token units, even when funding a different output token.
 *
 * @example
 * ```ts
 * import { FundingSourceEarn } from 'ox/tempo'
 *
 * FundingSourceEarn.encodeExecutionData({
 *   maxValueIn: 50_000_000n,
 *   vault: '0x0101010101010101010101010101010101010101',
 * })
 * ```
 */
export function encodeExecutionData(request: Request): Hex.Hex {
  return AbiParameters.encode(parameters, [
    request.vault,
    request.maxAmountIn ?? 2n ** 256n - 1n,
    request.maxValueIn ?? 2n ** 256n - 1n,
  ])
}

/**
 * Encodes Earn source configuration as `configData`.
 *
 * Execution must use the configured vault and cannot increase either cap.
 *
 * @example
 * ```ts
 * import { FundingSourceEarn } from 'ox/tempo'
 *
 * FundingSourceEarn.encodeConfigData({
 *   maxValueIn: 50_000_000n,
 *   vault: '0x0101010101010101010101010101010101010101',
 * })
 * ```
 */
export function encodeConfigData(config: Request): Hex.Hex {
  return encodeExecutionData(config)
}

/**
 * Decodes an Earn execution request or configuration, returning both concrete caps.
 *
 * @example
 * ```ts
 * import { FundingSourceEarn } from 'ox/tempo'
 *
 * FundingSourceEarn.decode(FundingSourceEarn.encodeConfigData({
 *   vault: '0x0101010101010101010101010101010101010101',
 * }))
 * ```
 */
export function decode(data: Hex.Hex): Required<Request> {
  const [vault, maxAmountIn, maxValueIn] = AbiParameters.decode(
    parameters,
    data,
  )
  return { maxAmountIn, maxValueIn, vault }
}
