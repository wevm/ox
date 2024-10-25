import * as Authorization from '../../Authorization.js'
import type * as Errors from '../../Errors.js'
import * as Hash from '../../Hash.js'
import * as Hex from '../../Hex.js'
import * as Rlp from '../../Rlp.js'

/**
 * Computes the hash for an {@link ox#Authorization.Authorization} in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const hash = Authorization.hash(authorization) // [!code focus]
 * ```
 *
 * @param authorization - The {@link ox#Authorization.Authorization}.
 * @returns The hash.
 */
export function Authorization_hash(
  authorization: Authorization.Authorization,
): Hex.Hex {
  return Hash.keccak256(
    Hex.concat('0x05', Rlp.fromHex(Authorization.toTuple(authorization))),
  )
}

export declare namespace Authorization_hash {
  type ErrorType =
    | Authorization.toTuple.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

Authorization_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization.hash.ErrorType
