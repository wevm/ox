import type { GlobalErrorType } from '../Errors/error.js'
import { Signature_extract } from '../Signature/extract.js'
import type {
  Authorization,
  Authorization_Rpc,
  Authorization_Signed,
} from './types.js'

/**
 * Converts an {@link Authorization#Rpc} to an {@link Authorization#Authorization}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.fromRpc({
 *   chainId: '0x1',
 *   contractAddress: '0x0000000000000000000000000000000000000000',
 *   nonce: '0x1',
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   yParity: '0x0',
 * })
 * ```
 *
 * @param authorization - The RPC-formatted Authorization.
 * @returns An {@link Authorization#Authorization}.
 */
export function Authorization_fromRpc(
  authorization: Authorization_Rpc,
): Authorization_Signed {
  const { chainId, contractAddress, nonce } = authorization
  const signature = Signature_extract(authorization)!

  return {
    chainId: Number(chainId),
    contractAddress,
    nonce: BigInt(nonce),
    ...signature,
  }
}

export declare namespace Authorization_fromRpc {
  type ErrorType = GlobalErrorType
}

Authorization_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_fromRpc.ErrorType
