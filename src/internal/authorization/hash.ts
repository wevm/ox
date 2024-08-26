import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import { Hex_concat } from '../hex/concat.js'
import { Rlp_fromHex } from '../rlp/from.js'
import type { Authorization } from '../types/authorization.js'
import type { Hex } from '../types/data.js'
import { Authorization_toTuple } from './toTuple.js'

/**
 * Computes the hash for an {@link Authorization#Authorization} in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 69n,
 * })
 *
 * const hash = Authorization.hash(authorization)
 * ```
 */
export function Authorization_hash(
  authorization: Authorization,
): Authorization_hash.ReturnType {
  return Hash_keccak256(
    Hex_concat('0x05', Rlp_fromHex(Authorization_toTuple(authorization))),
  )
}

export declare namespace Authorization_hash {
  type ReturnType = Hex

  type ErrorType =
    | Authorization_toTuple.ErrorType
    | Hash_keccak256.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

Authorization_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_hash.ErrorType
