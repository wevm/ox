import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import type * as FundingSource from './FundingSource.js'

/**
 * Concrete native DEX funding request or policy entry. */
export type Request = {
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
    data: encode(request),
    to: nativeDexAddress,
  } satisfies FundingSource.Source
}

/**
 * Encodes a native DEX funding request or policy entry.
 *
 * @example
 * ```ts
 * import { FundingSourceDex } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingSourceDex.encode({
 *   maxAmountIn: 30_000_000n,
 *   tokenIn: token
 * })
 * ```
 */
export function encode(request: Request): Hex.Hex {
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
 * import { FundingSourceDex } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingSourceDex.decode(
 *   FundingSourceDex.encode({ tokenIn: token })
 * )
 * ```
 */
export function decode(data: Hex.Hex): Required<Request> {
  const [tokenIn, maxAmountIn] = AbiParameters.decode(parameters, data)
  return { tokenIn, maxAmountIn }
}
