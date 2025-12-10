import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as TokenId from './TokenId.js'

/**
 * Converts a user token and validator token to a pool ID.
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
  return Hash.keccak256(
    Hex.concat(
      Hex.padLeft(TokenId.toAddress(value.userToken), 32),
      Hex.padLeft(TokenId.toAddress(value.validatorToken), 32),
    ),
  )
}

export declare namespace from {
  export type Value = {
    /** User token. */
    userToken: TokenId.TokenIdOrAddress
    /** Validator token. */
    validatorToken: TokenId.TokenIdOrAddress
  }
}
