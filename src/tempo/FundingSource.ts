import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import * as FundingSourceDex from './FundingSourceDex.js'

/** A funding source with execution or configuration data. */
export type Source = {
  /** ABI-encoded execution data for funding, or configuration data for policies and discovery. */
  data: Hex.Hex
  /** Funding source address. */
  to: Address.Address
}

/**
 * Creates a native DEX source for funding, policy rules, or discovery.
 *
 * @example
 * ```ts
 * import { FundingSource } from 'ox/tempo'
 *
 * FundingSource.dex({
 *   maxAmountIn: 30_000_000n,
 *   tokenIn: '0x20c0000000000000000000000000000000000000'
 * })
 * ```
 */
export const dex = FundingSourceDex.from
