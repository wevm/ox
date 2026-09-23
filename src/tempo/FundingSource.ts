import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

/** A source invoked to satisfy a funding requirement. */
export type Source = {
  /** Source-specific ABI-encoded request. */
  data: Hex.Hex
  /** Funding source address. */
  to: Address.Address
}

/**
 * Concrete native DEX funding request or policy entry. */
export type DexRequest = {
  /** Input cap in base units. Omission is unlimited; zero permits no input. */
  maxAmountIn?: bigint | undefined
  /** Input token to exchange for the required token. */
  tokenIn: Address.Address
}

const parameters = AbiParameters.from('address tokenIn, uint256 maxAmountIn')
const nativeDexAddress = '0x1120000000000000000000000000000000000001'

/**
 * Creates a native DEX source for a funding requirement.
 *
 * @example
 * ```ts
 * import { FundingSource } from 'ox/tempo'
 *
 * FundingSource.dex({
 *   tokenIn: '0x20c0000000000000000000000000000000000000',
 *   maxAmountIn: 30_000_000n,
 * })
 * ```
 */
export function dex(request: DexRequest) {
  return {
    data: encodeDex(request),
    to: nativeDexAddress,
  } satisfies Source
}

/**
 * Encodes a native DEX funding request or policy entry.
 *
 * @example
 * ```ts
 * import { FundingSource } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingSource.encodeDex({
 *   tokenIn: token,
 *   maxAmountIn: 30_000_000n
 * })
 * ```
 */
export function encodeDex(request: DexRequest): Hex.Hex {
  return AbiParameters.encode(parameters, [
    request.tokenIn,
    request.maxAmountIn ?? 2n ** 256n - 1n,
  ])
}

/**
 * Decodes native DEX funding data, returning the concrete input cap.
 *
 * @example
 * ```ts
 * import { FundingSource } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingSource.decodeDex(
 *   FundingSource.encodeDex({ tokenIn: token })
 * )
 * ```
 */
export function decodeDex(data: Hex.Hex): Required<DexRequest> {
  const [tokenIn, maxAmountIn] = AbiParameters.decode(parameters, data)
  return { tokenIn, maxAmountIn }
}
