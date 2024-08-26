import type { GlobalErrorType } from '../errors/error.js'
import type { Authorization } from '../types/authorization.js'
import type { Hex } from '../types/data.js'
import { Authorization_hash } from './hash.js'

/**
 * Computes the sign payload for an {@link Authorization#Authorization} in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
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
export function Authorization_getSignPayload(
  authorization: Authorization,
): Authorization_getSignPayload.ReturnType {
  return Authorization_hash(authorization)
}

export declare namespace Authorization_getSignPayload {
  type ReturnType = Hex

  type ErrorType = Authorization_hash.ErrorType | GlobalErrorType
}

Authorization_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_getSignPayload.ErrorType
