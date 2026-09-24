import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import type * as FundingSource from './FundingSource.js'

/** Native DEX execution arguments or source configuration. */
export type Request = {
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
 * import { FundingSourceDex } from 'ox/tempo'
 *
 * FundingSourceDex.from({
 *   maxAmountIn: 30_000_000n,
 *   tokenIn: '0x20c0000000000000000000000000000000000000'
 * })
 * ```
 */
export function from(request: Request) {
  return {
    data: encodeExecutionData(request),
    to: nativeDexAddress,
  } satisfies FundingSource.Source
}

/**
 * Encodes native DEX execution arguments passed to funding hooks as `executionData`.
 *
 * @example
 * ```ts
 * import { FundingSourceDex } from 'ox/tempo'
 *
 * FundingSourceDex.encodeExecutionData({
 *   maxAmountIn: 30_000_000n,
 *   tokenIn: '0x20c0000000000000000000000000000000000001'
 * })
 * ```
 */
export function encodeExecutionData(request: Request): Hex.Hex {
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
 * import { FundingSourceDex } from 'ox/tempo'
 *
 * FundingSourceDex.encodeConfigData({
 *   maxAmountIn: 30_000_000n,
 *   tokenIn: '0x20c0000000000000000000000000000000000001'
 * })
 * ```
 */
export function encodeConfigData(config: Request): Hex.Hex {
  return encodeExecutionData(config)
}

/**
 * Decodes native DEX execution data, returning the concrete input cap.
 *
 * @example
 * ```ts
 * import { FundingSourceDex } from 'ox/tempo'
 *
 * FundingSourceDex.decodeExecutionData(
 *   FundingSourceDex.encodeExecutionData({
 *     tokenIn: '0x20c0000000000000000000000000000000000001'
 *   })
 * )
 * ```
 */
export function decodeExecutionData(data: Hex.Hex): Required<Request> {
  const [tokenIn, maxAmountIn] = AbiParameters.decode(parameters, data)
  return { tokenIn, maxAmountIn }
}

/**
 * Decodes native DEX source configuration, returning concrete input caps.
 *
 * @example
 * ```ts
 * import { FundingSourceDex } from 'ox/tempo'
 *
 * FundingSourceDex.decodeConfigData(FundingSourceDex.encodeConfigData({
 *   tokenIn: '0x0101010101010101010101010101010101010101',
 * }))
 * ```
 */
export function decodeConfigData(data: Hex.Hex): Required<Request> {
  return decodeExecutionData(data)
}
