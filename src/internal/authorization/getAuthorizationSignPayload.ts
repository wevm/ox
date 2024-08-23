import type { GlobalErrorType } from '../errors/error.js'
import type { Authorization } from '../types/authorization.js'
import type { Hex } from '../types/data.js'
import { hashAuthorization } from './hashAuthorization.js'

/**
 * Computes the sign payload for an {@link Authorization} in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
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
 * const payload = Authorization.getSignPayload(authorization)
 * ```
 */
export function getAuthorizationSignPayload(
  authorization: Authorization,
): getAuthorizationSignPayload.ReturnType {
  return hashAuthorization(authorization)
}

export declare namespace getAuthorizationSignPayload {
  type ReturnType = Hex

  type ErrorType = hashAuthorization.ErrorType | GlobalErrorType
}

getAuthorizationSignPayload.parseError = (error: unknown) =>
  error as getAuthorizationSignPayload.ErrorType
