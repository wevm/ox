import type * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as ox_TransactionRequest from '../core/TransactionRequest.js'
import * as AuthorizationTempo from './AuthorizationTempo.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as TokenId from './TokenId.js'
import * as Transaction from './Transaction.js'
import type { Call } from './TxEnvelopeTempo.js'

type KeyType = 'secp256k1' | 'p256' | 'webAuthn'

/**
 * A Transaction Request that is generic to all transaction types.
 *
 * Extends the [Execution API specification](https://github.com/ethereum/execution-apis/blob/4aca1d7a3e5aab24c8f6437131289ad386944eaa/src/schemas/transaction.yaml#L358-L423)
 * with Tempo-specific fields for batched calls, fee tokens, access keys, and scheduled execution.
 *
 * @see {@link https://docs.tempo.xyz/protocol/transactions Tempo Transactions}
 */
export type TransactionRequest<
  bigintType = bigint,
  numberType = number,
  type extends string = string,
> = Compute<
  Omit<
    ox_TransactionRequest.TransactionRequest<bigintType, numberType, type>,
    'authorizationList'
  > & {
    authorizationList?:
      | AuthorizationTempo.ListSigned<bigintType, numberType>
      | undefined
    calls?: readonly Call<bigintType>[] | undefined
    keyAuthorization?: KeyAuthorization.KeyAuthorization<true> | undefined
    keyData?: Hex.Hex | undefined
    keyType?: KeyType | undefined
    feeToken?: TokenId.TokenIdOrAddress | undefined
    nonceKey?: 'random' | bigintType | undefined
    validBefore?: numberType | undefined
    validAfter?: numberType | undefined
  }
>

/** RPC representation of a {@link ox#TransactionRequest.TransactionRequest}. */
export type Rpc = Omit<
  TransactionRequest<Hex.Hex, Hex.Hex, string>,
  'authorizationList' | 'keyAuthorization'
> & {
  authorizationList?: AuthorizationTempo.ListRpc | undefined
  keyAuthorization?: KeyAuthorization.Rpc | undefined
  nonceKey?: Hex.Hex | undefined
}

/**
 * Converts a {@link ox#TransactionRequest.TransactionRequest} to a {@link ox#TransactionRequest.Rpc}.
 *
 * @see {@link https://docs.tempo.xyz/protocol/transactions Tempo Transactions}
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { TransactionRequest } from 'ox/tempo'
 *
 * const request = TransactionRequest.toRpc({
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0xcafebabecafebabecafebabecafebabecafebabe',
 *   }],
 *   feeToken: '0x20c0000000000000000000000000000000000000',
 * })
 * ```
 *
 * @example
 * ### Using with a Provider
 *
 * You can use {@link ox#Provider.(from:function)} to instantiate an EIP-1193 Provider and
 * send a transaction to the Wallet using the `eth_sendTransaction` method.
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { Provider, Value } from 'ox'
 * import { TransactionRequest } from 'ox/tempo'
 *
 * const provider = Provider.from(window.ethereum!)
 *
 * const request = TransactionRequest.toRpc({
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0xcafebabecafebabecafebabecafebabecafebabe',
 *   }],
 *   feeToken: '0x20c0000000000000000000000000000000000000',
 * })
 *
 * const hash = await provider.request({ // [!code focus]
 *   method: 'eth_sendTransaction', // [!code focus]
 *   params: [request], // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param request - The request to convert.
 * @returns An RPC request.
 */
export function toRpc(request: TransactionRequest): Rpc {
  const request_rpc = ox_TransactionRequest.toRpc({
    ...request,
    authorizationList: undefined,
  }) as Rpc

  if (request.authorizationList)
    request_rpc.authorizationList = AuthorizationTempo.toRpcList(
      request.authorizationList,
    )
  if (request.calls)
    request_rpc.calls = request.calls.map((call) => ({
      to: call.to,
      value: call.value ? Hex.fromNumber(call.value) : '0x',
      data: call.data ?? '0x',
    }))
  if (typeof request.feeToken !== 'undefined')
    request_rpc.feeToken = TokenId.toAddress(request.feeToken)
  if (request.keyAuthorization)
    request_rpc.keyAuthorization = KeyAuthorization.toRpc(
      request.keyAuthorization,
    )
  if (typeof request.validBefore !== 'undefined')
    request_rpc.validBefore = Hex.fromNumber(request.validBefore)
  if (typeof request.validAfter !== 'undefined')
    request_rpc.validAfter = Hex.fromNumber(request.validAfter)

  const nonceKey = (() => {
    if (request.nonceKey === 'random') return Hex.random(6)
    if (typeof request.nonceKey === 'bigint')
      return Hex.fromNumber(request.nonceKey)
    return undefined
  })()
  if (nonceKey) request_rpc.nonceKey = nonceKey

  if (
    typeof request.calls !== 'undefined' ||
    typeof request.feeToken !== 'undefined' ||
    typeof request.keyAuthorization !== 'undefined' ||
    typeof request.nonceKey !== 'undefined' ||
    typeof request.validBefore !== 'undefined' ||
    typeof request.validAfter !== 'undefined' ||
    request.type === 'tempo'
  ) {
    request_rpc.type = Transaction.toRpcType.tempo
    delete request_rpc.data
    delete request_rpc.input
    delete request_rpc.to
    delete request_rpc.value
  }

  return request_rpc
}

export declare namespace toRpc {
  export type ErrorType =
    | AuthorizationTempo.toRpcList.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}
