import type * as Authorization from '../../Authorization.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import * as Signature from '../../Signature.js'

/**
 * Converts an {@link ox#Authorization.Authorization} to an {@link ox#Authorization.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.toRpc({
 *   address: '0x0000000000000000000000000000000000000000',
 *   chainId: 1,
 *   nonce: 1n,
 *   r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
 *   s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
 *   yParity: 0,
 * })
 * ```
 *
 * @param authorization - An Authorization.
 * @returns An RPC-formatted Authorization.
 */
export function Authorization_toRpc(
  authorization: Authorization.Signed,
): Authorization.Rpc {
  const { address, chainId, nonce, ...signature } = authorization

  return {
    address,
    chainId: Hex.fromNumber(chainId),
    nonce: Hex.fromNumber(nonce),
    ...Signature.toRpc(signature),
  }
}

export declare namespace Authorization_toRpc {
  type ErrorType =
    | Hex.fromNumber.ErrorType
    | Signature.toRpc.ErrorType
    | Errors.GlobalErrorType
}

Authorization_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization.toRpc.ErrorType
