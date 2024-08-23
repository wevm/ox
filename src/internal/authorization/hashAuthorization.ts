import { concatHex } from '../data/concat.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import { hexToRlp } from '../rlp/encodeRlp.js'
import type { Authorization } from '../types/authorization.js'
import type { Hex } from '../types/data.js'
import { toAuthorizationTuple } from './toAuthorizationTuple.js'

/**
 * Computes the hash for an {@link Authorization} in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
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
export function hashAuthorization(
  authorization: Authorization,
): hashAuthorization.ReturnType {
  return keccak256(
    concatHex('0x05', hexToRlp(toAuthorizationTuple(authorization))),
  )
}

export declare namespace hashAuthorization {
  type ReturnType = Hex

  type ErrorType =
    | keccak256.ErrorType
    | concatHex.ErrorType
    | hexToRlp.ErrorType
    | GlobalErrorType
}

hashAuthorization.parseError = (error: unknown) =>
  error as hashAuthorization.ErrorType
