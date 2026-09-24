import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

/** A funding source with execution or configuration data. */
export type Source = {
  /** ABI-encoded execution data for funding, or configuration data for policies and discovery. */
  data: Hex.Hex
  /** Funding source address. */
  to: Address.Address
}

/** Native DEX execution arguments or source configuration. */
export type DexRequest = {
  /** Input cap in base units. Omission is unlimited; zero permits no input. */
  maxAmountIn?: bigint | undefined
  /** Input token to exchange for the required token. */
  tokenIn: Address.Address
}

const parameters = AbiParameters.from('address tokenIn, uint256 maxAmountIn')
const nativeDexAddress = '0x1120000000000000000000000000000000000001'

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
export function dex(request: DexRequest) {
  return {
    data: encodeExecutionData(request),
    to: nativeDexAddress,
  } satisfies Source
}

/**
 * Encodes native DEX execution arguments passed to funding hooks as `executionData`.
 *
 * @example
 * ```ts
 * import { FundingSource } from 'ox/tempo'
 *
 * FundingSource.encodeExecutionData({
 *   maxAmountIn: 30_000_000n,
 *   tokenIn: '0x20c0000000000000000000000000000000000001'
 * })
 * ```
 */
export function encodeExecutionData(request: DexRequest): Hex.Hex {
  return AbiParameters.encode(parameters, [
    request.tokenIn,
    request.maxAmountIn ?? 2n ** 256n - 1n,
  ])
}

/**
 * Encodes native DEX source configuration passed to funding hooks as `configData`.
 *
 * The DEX uses the same encoding for execution and configuration data.
 *
 * @example
 * ```ts
 * import { FundingSource } from 'ox/tempo'
 *
 * FundingSource.encodeConfigData({
 *   maxAmountIn: 30_000_000n,
 *   tokenIn: '0x20c0000000000000000000000000000000000001'
 * })
 * ```
 */
export function encodeConfigData(config: DexRequest): Hex.Hex {
  return encodeExecutionData(config)
}

/**
 * Decodes native DEX execution or configuration data, returning the concrete input cap.
 *
 * @example
 * ```ts
 * import { FundingSource } from 'ox/tempo'
 *
 * FundingSource.decode(
 *   FundingSource.encodeExecutionData({
 *     tokenIn: '0x20c0000000000000000000000000000000000001'
 *   })
 * )
 * ```
 */
export function decode(data: Hex.Hex): Required<DexRequest> {
  const [tokenIn, maxAmountIn] = AbiParameters.decode(parameters, data)
  return { tokenIn, maxAmountIn }
}
