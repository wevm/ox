import type * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as Quantity from '../core/internal/quantity.js'
import type { Compute } from '../core/internal/types.js'
import * as Signature from '../core/Signature.js'
import * as ox_TransactionRequest from '../core/TransactionRequest.js'
import * as AuthorizationTempo from './AuthorizationTempo.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TokenId from './TokenId.js'
import * as Transaction from './Transaction.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'
import type { Call } from './TxEnvelopeTempo.js'

type KeyType = 'secp256k1' | 'p256' | 'webAuthn'

/**
 * A Transaction Request that is generic to all transaction types.
 *
 * Extends the [Execution API specification](https://github.com/ethereum/execution-apis/blob/4aca1d7a3e5aab24c8f6437131289ad386944eaa/src/schemas/transaction.yaml#L358-L423)
 * with Tempo-specific fields for batched calls, fee tokens, access keys, and scheduled execution.
 *
 * @see {@link https://docs.tempo.xyz/protocol/transactions}
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
    feePayerSignature?: Signature.Signature<true, numberType> | null | undefined
    keyAuthorization?: KeyAuthorization.KeyAuthorization<true> | undefined
    keyData?: Hex.Hex | undefined
    keyType?: KeyType | undefined
    feePayer?: boolean | undefined
    feeToken?: TokenId.TokenIdOrAddress | undefined
    nonceKey?: 'random' | bigintType | undefined
    signature?: SignatureEnvelope.SignatureEnvelope<numberType> | undefined
    validBefore?: numberType | undefined
    validAfter?: numberType | undefined
  }
>

/** RPC representation of a {@link ox#TransactionRequest.TransactionRequest}. */
export type Rpc = Omit<
  TransactionRequest<Hex.Hex, Hex.Hex, string>,
  | 'authorizationList'
  | 'feePayerSignature'
  | 'feeToken'
  | 'keyAuthorization'
  | 'signature'
> & {
  authorizationList?: AuthorizationTempo.ListRpc | undefined
  feePayerSignature?: Signature.Rpc | null | undefined
  feeToken?: Hex.Hex | undefined
  keyAuthorization?: KeyAuthorization.Rpc | undefined
  nonceKey?: Hex.Hex | undefined
  signature?: SignatureEnvelope.SignatureEnvelopeRpc | undefined
}

/**
 * Converts a {@link ox#TransactionRequest.Rpc} to a {@link ox#TransactionRequest.TransactionRequest}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionRequest } from 'ox/tempo'
 *
 * const request = TransactionRequest.fromRpc({
 *   calls: [
 *     {
 *       data: '0xdeadbeef',
 *       to: '0xcafebabecafebabecafebabecafebabecafebabe'
 *     }
 *   ],
 *   feeToken: '0x20c0000000000000000000000000000000000000',
 *   type: '0x76'
 * })
 * ```
 *
 * @param request - The RPC request to convert.
 * @returns A transaction request.
 */
export function fromRpc(request: Rpc): TransactionRequest {
  const { authorizationList: _, ...rest } = request
  const request_ = ox_TransactionRequest.fromRpc(
    rest as any,
  ) as TransactionRequest

  if (typeof request.type !== 'undefined')
    request_.type =
      Transaction.fromRpcType[
        request.type as keyof typeof Transaction.fromRpcType
      ] || request_.type

  if (request.authorizationList)
    request_.authorizationList = AuthorizationTempo.fromRpcList(
      request.authorizationList,
    )
  if (request.signature)
    request_.signature = SignatureEnvelope.fromRpc(request.signature)
  if (request.feePayerSignature)
    request_.feePayerSignature = Signature.fromRpc(request.feePayerSignature)
  if (request.calls)
    request_.calls = request.calls.map((call) => {
      const mapped: Call<bigint> = {
        to: call.to,
        data: call.data,
      }
      if (call.value && call.value !== '0x')
        mapped.value = Hex.toBigInt(call.value)
      return mapped
    })
  if (typeof request.feeToken !== 'undefined')
    request_.feeToken = request.feeToken
  if (request.keyAuthorization)
    request_.keyAuthorization = KeyAuthorization.fromRpc(
      request.keyAuthorization,
    )
  if (typeof request.validBefore !== 'undefined')
    request_.validBefore = Hex.toNumber(request.validBefore as Hex.Hex)
  if (typeof request.validAfter !== 'undefined')
    request_.validAfter = Hex.toNumber(request.validAfter as Hex.Hex)
  if (typeof request.nonceKey !== 'undefined')
    request_.nonceKey = Hex.toBigInt(request.nonceKey as Hex.Hex)

  return request_
}

export declare namespace fromRpc {
  export type ErrorType =
    | AuthorizationTempo.fromRpcList.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.toBigInt.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#TransactionRequest.TransactionRequest} to a {@link ox#TransactionRequest.Rpc}.
 *
 * @see {@link https://docs.tempo.xyz/protocol/transactions}
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { TransactionRequest } from 'ox/tempo'
 *
 * const request = TransactionRequest.toRpc({
 *   calls: [
 *     {
 *       data: '0xdeadbeef',
 *       to: '0xcafebabecafebabecafebabecafebabecafebabe'
 *     }
 *   ],
 *   feeToken: '0x20c0000000000000000000000000000000000000'
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
 * // @noErrors
 * import 'ox/window'
 * import { Provider, Value } from 'ox'
 * import { TransactionRequest } from 'ox/tempo'
 *
 * const provider = Provider.from(window.ethereum!)
 *
 * const request = TransactionRequest.toRpc({
 *   calls: [
 *     {
 *       data: '0xdeadbeef',
 *       to: '0xcafebabecafebabecafebabecafebabecafebabe'
 *     }
 *   ],
 *   feeToken: '0x20c0000000000000000000000000000000000000'
 * })
 *
 * const hash = await provider.request({
 *   // [!code focus]
 *   method: 'eth_sendTransaction', // [!code focus]
 *   params: [request] // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param request - The request to convert.
 * @returns An RPC request.
 */
export function toRpc(request: toRpc.Input): Rpc {
  const request_rpc = ox_TransactionRequest.toRpc({
    ...request,
    authorizationList: undefined,
  }) as Rpc

  if (request.authorizationList)
    request_rpc.authorizationList = AuthorizationTempo.toRpcList(
      request.authorizationList,
    )
  if (request.signature)
    request_rpc.signature = SignatureEnvelope.toRpc(request.signature)
  if (request.feePayerSignature)
    request_rpc.feePayerSignature = Signature.toRpc(request.feePayerSignature)
  if (request.calls)
    request_rpc.calls = request.calls.map((call) => ({
      to: call.to,
      value: call.value ? Quantity.fromNumberish(call.value) : '0x',
      data: call.data ?? '0x',
    }))
  else if (request.to || request.data || request.value)
    request_rpc.calls = [
      {
        to: request.to ?? undefined,
        value: request.value ? Quantity.fromNumberish(request.value) : '0x',
        data: request.data ?? '0x',
      },
    ]
  if (typeof request.feeToken !== 'undefined')
    request_rpc.feeToken = TokenId.toAddress(request.feeToken)
  if (request.keyAuthorization)
    request_rpc.keyAuthorization = KeyAuthorization.toRpc(
      request.keyAuthorization,
    )
  if (typeof request.validBefore !== 'undefined')
    request_rpc.validBefore = Quantity.fromNumberish(request.validBefore)
  if (typeof request.validAfter !== 'undefined')
    request_rpc.validAfter = Quantity.fromNumberish(request.validAfter)

  const nonceKey = (() => {
    if (request.nonceKey === 'random') return Hex.random(24)
    if (request.nonceKey !== undefined)
      return Quantity.fromNumberish(request.nonceKey)
    return undefined
  })()
  if (nonceKey) request_rpc.nonceKey = nonceKey

  if (
    typeof request.calls !== 'undefined' ||
    typeof request.feePayer !== 'undefined' ||
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
  /** Numberish input accepted by {@link ox#TransactionRequest.(toRpc:function)}. */
  export type Input = TransactionRequest<
    Hex.Hex | bigint | number,
    Hex.Hex | number
  >

  export type ErrorType =
    | AuthorizationTempo.toRpcList.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a Tempo {@link ox#TransactionRequest.TransactionRequest} to a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionRequest } from 'ox/tempo'
 *
 * const envelope = TransactionRequest.toEnvelope({
 *   calls: [
 *     {
 *       data: '0xdeadbeef',
 *       to: '0xcafebabecafebabecafebabecafebabecafebabe'
 *     }
 *   ],
 *   chainId: 1,
 *   feeToken: '0x20c0000000000000000000000000000000000000',
 *   maxFeePerGas: 1n
 * })
 * ```
 *
 * @param request - The transaction request to convert.
 * @param options - Options.
 * @returns A Tempo transaction envelope.
 */
export function toEnvelope(
  request: TransactionRequest,
  options: toEnvelope.Options = {},
): TxEnvelopeTempo.TxEnvelopeTempo {
  const calls = (() => {
    if (request.calls) return request.calls
    if (request.to || request.data || request.value)
      return [
        {
          ...(typeof request.to !== 'undefined' && request.to !== null
            ? { to: request.to }
            : {}),
          ...(typeof request.data !== 'undefined'
            ? { data: request.data }
            : {}),
          ...(typeof request.value !== 'undefined'
            ? { value: request.value }
            : {}),
        },
      ] satisfies readonly Call[]
    return [] as readonly Call[]
  })()

  const nonceKey = (() => {
    if (request.nonceKey === 'random') return Hex.toBigInt(Hex.random(24))
    if (typeof request.nonceKey === 'bigint') return request.nonceKey
    return undefined
  })()

  type Input = TxEnvelopeTempo.Input
  const input: Input = {
    type: 'tempo',
    calls,
    chainId: request.chainId!,
    ...(typeof request.accessList !== 'undefined'
      ? { accessList: request.accessList }
      : {}),
    ...(typeof request.authorizationList !== 'undefined'
      ? { authorizationList: request.authorizationList }
      : {}),
    ...(typeof request.feePayerSignature !== 'undefined'
      ? { feePayerSignature: request.feePayerSignature }
      : {}),
    ...(typeof request.feeToken !== 'undefined'
      ? { feeToken: request.feeToken }
      : {}),
    ...(typeof request.from !== 'undefined' ? { from: request.from } : {}),
    ...(typeof request.gas !== 'undefined' ? { gas: request.gas } : {}),
    ...(typeof request.keyAuthorization !== 'undefined'
      ? { keyAuthorization: request.keyAuthorization }
      : {}),
    ...(typeof request.maxFeePerGas !== 'undefined'
      ? { maxFeePerGas: request.maxFeePerGas }
      : {}),
    ...(typeof request.maxPriorityFeePerGas !== 'undefined'
      ? { maxPriorityFeePerGas: request.maxPriorityFeePerGas }
      : {}),
    ...(typeof request.nonce !== 'undefined' ? { nonce: request.nonce } : {}),
    ...(typeof nonceKey !== 'undefined' ? { nonceKey } : {}),
    ...(typeof request.signature !== 'undefined'
      ? { signature: request.signature }
      : {}),
    ...(typeof request.validAfter !== 'undefined'
      ? { validAfter: request.validAfter }
      : {}),
    ...(typeof request.validBefore !== 'undefined'
      ? { validBefore: request.validBefore }
      : {}),
  }

  return TxEnvelopeTempo.from(input, options) as TxEnvelopeTempo.TxEnvelopeTempo
}

export declare namespace toEnvelope {
  type Options = {
    /** Optional fee-payer signature to attach to the envelope. */
    feePayerSignature?: Signature.Signature | null | undefined
    /** Optional signature envelope to attach. */
    signature?: SignatureEnvelope.from.Value | undefined
  }

  type ErrorType =
    | TxEnvelopeTempo.from.ErrorType
    | Hex.random.ErrorType
    | Hex.toBigInt.ErrorType
    | Errors.GlobalErrorType
}
