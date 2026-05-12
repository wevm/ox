import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type * as TempoAddress from './TempoAddress.js'
import * as TokenId from './TokenId.js'

/**
 * Converts a user token and validator token to a pool ID.
 *
 * Pool IDs are deterministic keys derived from two token addresses (order-independent)
 * used to identify trading pairs on Tempo's enshrined stablecoin DEX.
 *
 * [Stablecoin DEX Specification](https://docs.tempo.xyz/protocol/exchange/spec)
 *
 * @example
 * ```ts twoslash
 * import { PoolId } from 'ox/tempo'
 *
 * const poolId = PoolId.from({
 *   userToken: 1n,
 *   validatorToken: 2n,
 * })
 * ```
 *
 * @param value - User token and validator token.
 * @returns The pool ID.
 */
export function from(value: from.Value): Hex.Hex {
  const a = TokenId.toAddress(value.userToken)
  const b = TokenId.toAddress(value.validatorToken)
  const [left, right] = a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a]
  return Hash.keccak256(
    Hex.concat(Hex.padLeft(left, 32), Hex.padLeft(right, 32)),
  )
}

export declare namespace from {
  export type Value = {
    /** User token. */
    userToken: TokenId.TokenIdOrAddress<TempoAddress.Address>
    /** Validator token. */
    validatorToken: TokenId.TokenIdOrAddress<TempoAddress.Address>
  }
}
