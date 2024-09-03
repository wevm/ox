import type { GlobalErrorType } from '../Errors/error.js'
import { Authorization_fromRpc } from './fromRpc.js'
import type {
  Authorization,
  Authorization_ListRpc,
  Authorization_ListSigned,
} from './types.js'

/**
 * Converts an {@link Authorization#RpcList} to an {@link Authorization#List}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorizationList = Authorization.fromRpcList([{
 *   chainId: '0x1',
 *   contractAddress: '0x0000000000000000000000000000000000000000',
 *   nonce: '0x1',
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   yParity: '0x0',
 * }])
 * ```
 *
 * @param authorizationList - The RPC-formatted Authorization list.
 * @returns An {@link Authorization#List}.
 */
export function Authorization_fromRpcList(
  authorizationList: Authorization_ListRpc,
): Authorization_ListSigned {
  return authorizationList.map(Authorization_fromRpc)
}

export declare namespace Authorization_fromRpcList {
  type ErrorType = GlobalErrorType
}

Authorization_fromRpcList.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_fromRpcList.ErrorType
