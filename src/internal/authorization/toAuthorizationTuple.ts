import type { GlobalErrorType } from '../errors/error.js'
import { numberToHex } from '../hex/toHex.js'
import { extractSignature } from '../signature/extractSignature.js'
import { toSignatureTuple } from '../signature/toSignatureTuple.js'
import type {
  Authorization,
  AuthorizationTuple,
} from '../types/authorization.js'
import type { Signature } from '../types/signature.js'
import type { Compute } from '../types/utils.js'

/**
 * Converts an {@link Types#Authorization} to an {@link Types#AuthorizationTuple}.
 *
 * @example
 * // TODO
 */
export function toAuthorizationTuple<const authorization extends Authorization>(
  authorization: authorization,
): toAuthorizationTuple.ReturnType<authorization> {
  const { contractAddress, chainId, nonce } = authorization
  const signature = extractSignature(authorization)
  return [
    numberToHex(chainId),
    contractAddress,
    numberToHex(nonce),
    ...(signature ? toSignatureTuple(signature) : []),
  ] as never
}

export declare namespace toAuthorizationTuple {
  type ReturnType<authorization extends Authorization = Authorization> =
    Compute<AuthorizationTuple<authorization extends Signature ? true : false>>

  type ErrorType = GlobalErrorType
}

toAuthorizationTuple.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as toAuthorizationTuple.ErrorType
