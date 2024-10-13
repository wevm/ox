import type { GlobalErrorType } from '../Errors/error.js'
import { Authorization_toRpc } from './toRpc.js'
import type {
  Authorization_ListRpc,
  Authorization_ListSigned,
} from './types.js'

/**
 * Converts an {@link ox#Authorization.List} to an {@link ox#Authorization.ListRpc}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.toRpcList([{
 *   address: '0x0000000000000000000000000000000000000000',
 *   chainId: 1,
 *   nonce: 1n,
 *   r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
 *   s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
 *   yParity: 0,
 * }])
 * ```
 *
 * @param authorizationList - An Authorization List.
 * @returns An RPC-formatted Authorization List.
 */
export function Authorization_toRpcList(
  authorizationList: Authorization_ListSigned,
): Authorization_ListRpc {
  return authorizationList.map(Authorization_toRpc)
}

export declare namespace Authorization_toRpcList {
  type ErrorType = GlobalErrorType
}

Authorization_toRpcList.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_toRpcList.ErrorType
