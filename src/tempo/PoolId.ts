import * as Address from '../core/Address.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'

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
 *   userToken: '0x20c0000000000000000000000000000000000001',
 *   validatorToken: '0x20c0000000000000000000000000000000000002'
 * })
 * ```
 *
 * @param value - User token and validator token.
 * @returns The pool ID.
 */
export function from(value: from.Value): Hex.Hex {
  const { userToken, validatorToken } = value
  Address.assert(userToken)
  Address.assert(validatorToken)
  const [left, right] =
    userToken.toLowerCase() < validatorToken.toLowerCase()
      ? [userToken, validatorToken]
      : [validatorToken, userToken]
  return Hash.keccak256(
    Hex.concat(Hex.padLeft(left, 32), Hex.padLeft(right, 32)),
  )
}

export declare namespace from {
  export type Value = {
    /** User token address. */
    userToken: Address.Address
    /** Validator token address. */
    validatorToken: Address.Address
  }
}
