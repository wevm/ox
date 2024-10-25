import type * as Errors from '../../Errors.js'
import { Signature_extract } from '../Signature/extract.js'
import type { Authorization_Rpc, Authorization_Signed } from './types.js'

/**
 * Converts an {@link ox#Authorization.Rpc} to an {@link ox#Authorization.Authorization}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.fromRpc({
 *   address: '0x0000000000000000000000000000000000000000',
 *   chainId: '0x1',
 *   nonce: '0x1',
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   yParity: '0x0',
 * })
 * ```
 *
 * @param authorization - The RPC-formatted Authorization.
 * @returns A signed {@link ox#Authorization.Authorization}.
 */
export function Authorization_fromRpc(
  authorization: Authorization_Rpc,
): Authorization_Signed {
  const { address, chainId, nonce } = authorization
  const signature = Signature_extract(authorization)!

  return {
    address,
    chainId: Number(chainId),
    nonce: BigInt(nonce),
    ...signature,
  }
}

export declare namespace Authorization_fromRpc {
  type ErrorType = Errors.GlobalErrorType
}

Authorization_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_fromRpc.ErrorType
