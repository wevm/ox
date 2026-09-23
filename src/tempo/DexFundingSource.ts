import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

/**
 * Concrete native DEX funding request or policy entry. */
export type Request = {
  /**
   * Input token to exchange for the required token. */
  tokenIn: Address.Address
  /**
   * Input cap in base units. Omission is unlimited; zero permits no input. */
  maxAmountIn?: bigint | undefined
}

const parameters = AbiParameters.from('address tokenIn, uint256 maxAmountIn')

/**
 * Encodes a native DEX funding request or policy entry.
 *
 * @example
 * ```ts
 * import { DexFundingSource } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * DexFundingSource.encode({
 *   tokenIn: token,
 *   maxAmountIn: 30_000_000n
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
 * import { DexFundingSource } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * DexFundingSource.decode(
 *   DexFundingSource.encode({ tokenIn: token })
 * )
 * ```
 */
export function decode(data: Hex.Hex): Required<Request> {
  const [tokenIn, maxAmountIn] = AbiParameters.decode(parameters, data)
  return { tokenIn, maxAmountIn }
}
