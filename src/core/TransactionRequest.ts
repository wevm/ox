import type * as AccessList from './AccessList.js'
import type * as Address from './Address.js'
import * as Authorization from './Authorization.js'
import * as Blobs from './Blobs.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Compute } from './internal/types.js'
import type * as Kzg from './Kzg.js'
import * as Transaction from './Transaction.js'
import * as TxEnvelope from './TxEnvelope.js'
import type * as TxEnvelopeEip4844 from './TxEnvelopeEip4844.js'

/** A Transaction Request that is generic to all transaction types, as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/4aca1d7a3e5aab24c8f6437131289ad386944eaa/src/schemas/transaction.yaml#L358-L423). */
export type TransactionRequest<
  bigintType = bigint,
  numberType = number,
  type extends string = string,
> = Compute<{
  /** EIP-2930 Access List. */
  accessList?: AccessList.AccessList | undefined
  /** EIP-7702 Authorization List. */
  authorizationList?:
    | Authorization.ListSigned<bigintType, numberType>
    | undefined
  /** Versioned hashes of blobs to be included in the transaction. */
  blobVersionedHashes?: readonly Hex.Hex[] | undefined
  /** Raw blob data. */
  blobs?: readonly Hex.Hex[] | undefined
  /** EIP-155 Chain ID. */
  chainId?: numberType | undefined
  /** Contract code or a hashed method call with encoded args */
  data?: Hex.Hex | undefined
  /** @alias `data` – added for TransactionEnvelope - Transaction compatibility. */
  input?: Hex.Hex | undefined
  /** Sender of the transaction. */
  from?: Address.Address | undefined
  /** Gas provided for transaction execution */
  gas?: bigintType | undefined
  /** Base fee per gas. */
  gasPrice?: bigintType | undefined
  /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
  maxFeePerBlobGas?: bigintType | undefined
  /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
  maxFeePerGas?: bigintType | undefined
  /** Max priority fee per gas (in wei). */
  maxPriorityFeePerGas?: bigintType | undefined
  /** Unique number identifying this transaction */
  nonce?: bigintType | undefined
  /** Transaction recipient */
  to?: Address.Address | null | undefined
  /** Transaction type */
  type?: type | undefined
  /** Value in wei sent with this transaction */
  value?: bigintType | undefined
  /** ECDSA signature r. */
  r?: Hex.Hex | undefined
  /** ECDSA signature s. */
  s?: Hex.Hex | undefined
  /** ECDSA signature yParity. */
  yParity?: numberType | undefined
  /** @deprecated ECDSA signature v (for backwards compatibility). */
  v?: numberType | undefined
}>

/** RPC representation of a {@link ox#TransactionRequest.TransactionRequest}. */
export type Rpc = TransactionRequest<Hex.Hex, Hex.Hex, string>

/**
 * Converts a {@link ox#TransactionRequest.Rpc} to a {@link ox#TransactionRequest.TransactionRequest}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionRequest } from 'ox'
 *
 * const request = TransactionRequest.fromRpc({
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: '0x2386f26fc10000',
 * })
 * ```
 *
 * @param request - The RPC request to convert.
 * @returns A transaction request.
 */
export function fromRpc(request: Rpc): TransactionRequest {
  const request_ = { ...request } as TransactionRequest

  if (typeof request.authorizationList !== 'undefined')
    request_.authorizationList = Authorization.fromRpcList(
      request.authorizationList,
    )
  if (typeof request.chainId !== 'undefined')
    request_.chainId = Hex.toNumber(request.chainId)
  if (typeof request.gas !== 'undefined')
    request_.gas = Hex.toBigInt(request.gas)
  if (typeof request.gasPrice !== 'undefined')
    request_.gasPrice = Hex.toBigInt(request.gasPrice)
  if (typeof request.maxFeePerBlobGas !== 'undefined')
    request_.maxFeePerBlobGas = Hex.toBigInt(request.maxFeePerBlobGas)
  if (typeof request.maxFeePerGas !== 'undefined')
    request_.maxFeePerGas = Hex.toBigInt(request.maxFeePerGas)
  if (typeof request.maxPriorityFeePerGas !== 'undefined')
    request_.maxPriorityFeePerGas = Hex.toBigInt(request.maxPriorityFeePerGas)
  if (typeof request.nonce !== 'undefined')
    request_.nonce = Hex.toBigInt(request.nonce)
  if (typeof request.type !== 'undefined')
    request_.type =
      Transaction.fromRpcType[
        request.type as keyof typeof Transaction.fromRpcType
      ] || request.type
  if (typeof request.value !== 'undefined')
    request_.value = Hex.toBigInt(request.value)
  if (typeof request.yParity !== 'undefined')
    request_.yParity = Hex.toNumber(request.yParity)
  if (typeof request.v !== 'undefined') request_.v = Hex.toNumber(request.v)

  return request_
}

export declare namespace fromRpc {
  export type ErrorType =
    | Authorization.fromRpcList.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.toBigInt.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#TransactionRequest.TransactionRequest} to a {@link ox#TransactionRequest.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionRequest, Value } from 'ox'
 *
 * const request = TransactionRequest.toRpc({
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('0.01'),
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
 * import { Provider, TransactionRequest, Value } from 'ox'
 *
 * const provider = Provider.from(window.ethereum!)
 *
 * const request = TransactionRequest.toRpc({
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: Value.fromEther('0.01'),
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
  const request_rpc: Rpc = {}

  if (typeof request.accessList !== 'undefined')
    request_rpc.accessList = request.accessList
  if (typeof request.authorizationList !== 'undefined')
    request_rpc.authorizationList = Authorization.toRpcList(
      request.authorizationList,
    )
  if (typeof request.blobVersionedHashes !== 'undefined')
    request_rpc.blobVersionedHashes = request.blobVersionedHashes
  if (typeof request.blobs !== 'undefined') request_rpc.blobs = request.blobs
  if (typeof request.chainId !== 'undefined')
    request_rpc.chainId = Hex.fromNumber(request.chainId)
  if (typeof request.data !== 'undefined') {
    request_rpc.data = request.data
    request_rpc.input = request.data
  } else if (typeof request.input !== 'undefined') {
    request_rpc.data = request.input
    request_rpc.input = request.input
  }
  if (typeof request.from !== 'undefined') request_rpc.from = request.from
  if (typeof request.gas !== 'undefined')
    request_rpc.gas = Hex.fromNumber(request.gas)
  if (typeof request.gasPrice !== 'undefined')
    request_rpc.gasPrice = Hex.fromNumber(request.gasPrice)
  if (typeof request.maxFeePerBlobGas !== 'undefined')
    request_rpc.maxFeePerBlobGas = Hex.fromNumber(request.maxFeePerBlobGas)
  if (typeof request.maxFeePerGas !== 'undefined')
    request_rpc.maxFeePerGas = Hex.fromNumber(request.maxFeePerGas)
  if (typeof request.maxPriorityFeePerGas !== 'undefined')
    request_rpc.maxPriorityFeePerGas = Hex.fromNumber(
      request.maxPriorityFeePerGas,
    )
  if (typeof request.nonce !== 'undefined')
    request_rpc.nonce = Hex.fromNumber(request.nonce)
  if (typeof request.to !== 'undefined') request_rpc.to = request.to
  if (typeof request.type !== 'undefined')
    request_rpc.type =
      Transaction.toRpcType[
        request.type as keyof typeof Transaction.toRpcType
      ] || request.type
  if (typeof request.value !== 'undefined')
    request_rpc.value = Hex.fromNumber(request.value)
  if (typeof request.r !== 'undefined') request_rpc.r = request.r
  if (typeof request.s !== 'undefined') request_rpc.s = request.s
  if (typeof request.yParity !== 'undefined')
    request_rpc.yParity = Hex.fromNumber(request.yParity)
  if (typeof request.v !== 'undefined')
    request_rpc.v = Hex.fromNumber(request.v)

  return request_rpc
}

export declare namespace toRpc {
  export type ErrorType =
    | Authorization.toRpcList.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#TransactionRequest.TransactionRequest} to a {@link ox#(TransactionEnvelope:namespace).TxEnvelope}.
 *
 * Dispatches to the correct concrete envelope type via
 * {@link ox#(TransactionEnvelope:namespace).(getType:function)} (using `request.type`
 * when present, otherwise inferring from fee/blob/authorization fields), and
 * drops fields that do not belong to the chosen type.
 *
 * For EIP-4844, if `blobs` is provided without `sidecars`, sidecars and
 * `blobVersionedHashes` are derived via the `kzg` option. If `sidecars` is
 * already provided, it is passed through unchanged.
 *
 * Inputs are expected to be in canonical form (`bigint` numerics and
 * `'eip1559'`-style `type` strings). Pass RPC-shaped payloads through
 * {@link ox#TransactionRequest.(fromRpc:function)} first.
 *
 * @example
 * ```ts twoslash
 * import { TransactionRequest } from 'ox'
 *
 * const envelope = TransactionRequest.toEnvelope({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: 1n,
 * })
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 1n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip1559',
 * // @log:   value: 1n,
 * // @log: }
 * ```
 *
 * @param request - The transaction request to convert.
 * @param options - Options.
 * @returns A transaction envelope.
 */
export function toEnvelope(
  request: TransactionRequest,
  options: toEnvelope.Options = {},
): TxEnvelope.TxEnvelope {
  const type = TxEnvelope.getType(request as never) as TxEnvelope.Type | string

  if (type === 'legacy')
    return TxEnvelope.from({
      type: 'legacy',
      ...pickBase(request),
      ...(typeof request.chainId !== 'undefined'
        ? { chainId: request.chainId }
        : {}),
      ...(typeof request.gasPrice !== 'undefined'
        ? { gasPrice: request.gasPrice }
        : {}),
    }) as never

  if (type === 'eip2930')
    return TxEnvelope.from({
      type: 'eip2930',
      ...pickBase(request),
      chainId: request.chainId!,
      ...(typeof request.accessList !== 'undefined'
        ? { accessList: request.accessList }
        : {}),
      ...(typeof request.gasPrice !== 'undefined'
        ? { gasPrice: request.gasPrice }
        : {}),
    }) as never

  if (type === 'eip4844') {
    const { kzg } = options
    const blobs = request.blobs
    const hasSidecars =
      (request as { sidecars?: unknown }).sidecars !== undefined

    // Derive sidecars + versioned hashes from raw blobs when possible.
    const sidecars = (() => {
      if (hasSidecars)
        return (
          request as unknown as {
            sidecars: TxEnvelopeEip4844.Sidecars<Hex.Hex>
          }
        ).sidecars
      if (!blobs || blobs.length === 0) return undefined
      if (!kzg) throw new MissingKzgError()
      const commitments = Blobs.toCommitments(blobs, { kzg, as: 'Hex' })
      const cellProofs = Blobs.toCellProofs(blobs, { kzg, as: 'Hex' })
      return {
        blobs,
        commitments,
        cellProofs,
      } satisfies TxEnvelopeEip4844.Sidecars<Hex.Hex>
    })()

    const blobVersionedHashes = (() => {
      if (request.blobVersionedHashes) return request.blobVersionedHashes
      if (sidecars) {
        if (!kzg) throw new MissingKzgError()
        return Blobs.commitmentsToVersionedHashes(sidecars.commitments, {
          as: 'Hex',
        })
      }
      return []
    })()

    return TxEnvelope.from({
      type: 'eip4844',
      ...pickBase(request),
      chainId: request.chainId!,
      blobVersionedHashes,
      ...(typeof request.accessList !== 'undefined'
        ? { accessList: request.accessList }
        : {}),
      ...(typeof request.maxFeePerBlobGas !== 'undefined'
        ? { maxFeePerBlobGas: request.maxFeePerBlobGas }
        : {}),
      ...(typeof request.maxFeePerGas !== 'undefined'
        ? { maxFeePerGas: request.maxFeePerGas }
        : {}),
      ...(typeof request.maxPriorityFeePerGas !== 'undefined'
        ? { maxPriorityFeePerGas: request.maxPriorityFeePerGas }
        : {}),
      ...(sidecars ? { sidecars } : {}),
    }) as never
  }

  if (type === 'eip7702') {
    if (!request.authorizationList) throw new MissingAuthorizationListError()
    return TxEnvelope.from({
      type: 'eip7702',
      ...pickBase(request),
      chainId: request.chainId!,
      authorizationList: request.authorizationList,
      ...(typeof request.accessList !== 'undefined'
        ? { accessList: request.accessList }
        : {}),
      ...(typeof request.maxFeePerGas !== 'undefined'
        ? { maxFeePerGas: request.maxFeePerGas }
        : {}),
      ...(typeof request.maxPriorityFeePerGas !== 'undefined'
        ? { maxPriorityFeePerGas: request.maxPriorityFeePerGas }
        : {}),
    }) as never
  }

  // EIP-1559 (default)
  return TxEnvelope.from({
    type: 'eip1559',
    ...pickBase(request),
    chainId: request.chainId!,
    ...(typeof request.accessList !== 'undefined'
      ? { accessList: request.accessList }
      : {}),
    ...(typeof request.maxFeePerGas !== 'undefined'
      ? { maxFeePerGas: request.maxFeePerGas }
      : {}),
    ...(typeof request.maxPriorityFeePerGas !== 'undefined'
      ? { maxPriorityFeePerGas: request.maxPriorityFeePerGas }
      : {}),
  }) as never
}

export declare namespace toEnvelope {
  type Options = {
    /**
     * KZG context used to derive EIP-4844 `sidecars` and `blobVersionedHashes`
     * from raw `blobs`. Required when `blobs` is provided without `sidecars`
     * or `blobVersionedHashes`.
     */
    kzg?: Kzg.Kzg | undefined
  }

  type ErrorType =
    | TxEnvelope.getType.ErrorType
    | TxEnvelope.from.ErrorType
    | Blobs.toCommitments.ErrorType
    | Blobs.toCellProofs.ErrorType
    | Blobs.commitmentsToVersionedHashes.ErrorType
    | MissingKzgError
    | MissingAuthorizationListError
    | Errors.GlobalErrorType
}

// Picks the fields common to every `TxEnvelope.Base` shape off a
// `TransactionRequest`, dropping anything that is `undefined`.
function pickBase(request: TransactionRequest) {
  const base: Record<string, unknown> = {}
  if (typeof request.data !== 'undefined') base.data = request.data
  if (typeof request.input !== 'undefined') base.input = request.input
  if (typeof request.from !== 'undefined') base.from = request.from
  if (typeof request.gas !== 'undefined') base.gas = request.gas
  if (typeof request.nonce !== 'undefined') base.nonce = request.nonce
  if (typeof request.to !== 'undefined') base.to = request.to
  if (typeof request.value !== 'undefined') base.value = request.value
  if (typeof request.r !== 'undefined') base.r = request.r
  if (typeof request.s !== 'undefined') base.s = request.s
  if (typeof request.yParity !== 'undefined') base.yParity = request.yParity
  if (typeof request.v !== 'undefined') base.v = request.v
  return base
}

/** Thrown when a 4844 conversion is requested but no `kzg` context is provided. */
export class MissingKzgError extends Errors.BaseError {
  override readonly name = 'TransactionRequest.MissingKzgError'
  constructor() {
    super(
      'A `kzg` option is required to derive 4844 sidecars or `blobVersionedHashes` from `blobs`.',
      {
        docsPath: '/api/TransactionRequest/toEnvelope',
      },
    )
  }
}

/** Thrown when a 7702 conversion is requested but no `authorizationList` is provided. */
export class MissingAuthorizationListError extends Errors.BaseError {
  override readonly name = 'TransactionRequest.MissingAuthorizationListError'
  constructor() {
    super(
      'An `authorizationList` is required to convert a TransactionRequest into an EIP-7702 transaction envelope.',
    )
  }
}
