import type * as Address from './Address.js'
import * as Errors from './Errors.js'
import type * as Hex from './Hex.js'
import type * as Signature from './Signature.js'
import * as TransactionEip1559 from './TransactionEip1559.js'
import * as TransactionEip2930 from './TransactionEip2930.js'
import * as TransactionEip4844 from './TransactionEip4844.js'
import * as TransactionEip7702 from './TransactionEip7702.js'
import * as TransactionLegacy from './TransactionLegacy.js'
import type { Compute, UnionCompute } from './internal/types.js'
import type { OneOf } from './internal/types.js'

/**
 * An isomorphic Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml).
 *
 * Supports the following Transaction Types:
 *
 * - `legacy`
 * - `eip1559`
 * - `eip2930`
 * - `eip4844`
 * - `eip7702`
 */
export type Transaction<
  pending extends boolean = false,
  bigintType = bigint,
  numberType = number,
> = UnionCompute<
  OneOf<
    | TransactionLegacy.TransactionLegacy<pending, bigintType, numberType>
    | TransactionEip1559.TransactionEip1559<pending, bigintType, numberType>
    | TransactionEip2930.TransactionEip2930<pending, bigintType, numberType>
    | TransactionEip4844.TransactionEip4844<pending, bigintType, numberType>
    | TransactionEip7702.TransactionEip7702<pending, bigintType, numberType>
    | (Base & { type: Hex.Hex })
  >
>

/** Base properties of a Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Base<
  type extends string = string,
  pending extends boolean = false,
  bigintType = bigint,
  numberType = number,
> = Compute<{
  /** Hash of the block that contains this transaction, or `null` if pending. */
  blockHash: pending extends true ? null : Hex.Hex
  /** Number of block containing this transaction or `null` if pending */
  blockNumber: pending extends true ? null : bigintType
  /** Chain ID that this transaction is valid on. */
  chainId: numberType
  /** @alias `input` Added for TransactionEnvelope - Transaction compatibility. */
  data?: Hex.Hex | undefined
  /** Sender of this transaction */
  from: Address.Address
  /** Hash of this transaction */
  hash: Hex.Hex
  /** Contract code or a hashed method call with encoded args */
  input: Hex.Hex
  /** Gas provided for transaction execution */
  gas: bigintType
  /** Unique number identifying this transaction */
  nonce: bigintType
  /** Transaction recipient. `null` if the transaction is a contract creation. */
  to: Address.Address | null
  /** Index of this transaction in the block or `null` if pending */
  transactionIndex: pending extends true ? null : numberType
  /** Transaction type */
  type: type
  /** Value in wei sent with this transaction */
  value: bigintType
  /** ECDSA signature r. */
  r: bigintType
  /** ECDSA signature s. */
  s: bigintType
  /** ECDSA signature yParity. */
  yParity: numberType
  /** @deprecated ECDSA signature v (for backwards compatibility). */
  v?: numberType | undefined
}>

/** Base properties of an RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type BaseRpc<
  type extends string = string,
  pending extends boolean = false,
> = Base<type, pending, Hex.Hex, Hex.Hex>

/**
 * An isomorphic RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml).
 *
 * Supports the following Transaction Types:
 *
 * - `0x0`: legacy transactions
 * - `0x1`: EIP-1559 transactions
 * - `0x2`: EIP-2930 transactions
 * - `0x3`: EIP-4844 transactions
 * - `0x4`: EIP-7702 transactions
 */
export type Rpc<pending extends boolean = false> = UnionCompute<
  OneOf<
    | TransactionLegacy.Rpc<pending>
    | TransactionEip1559.Rpc<pending>
    | TransactionEip2930.Rpc<pending>
    | TransactionEip4844.Rpc<pending>
    | TransactionEip7702.Rpc<pending>
    | (BaseRpc & { type: Hex.Hex })
  >
>

/**
 * Union of Transaction types.
 *
 * - `legacy`
 * - `eip1559`
 * - `eip2930`
 * - `eip4844`
 * - `eip7702`
 * - any other string
 */
export type Type =
  | TransactionLegacy.Type
  | TransactionEip1559.Type
  | TransactionEip2930.Type
  | TransactionEip4844.Type
  | TransactionEip7702.Type
  | (string & {})

/**
 * Union of RPC Transaction types.
 *
 * - `0x0`: legacy transactions
 * - `0x1`: EIP-1559 transactions
 * - `0x2`: EIP-2930 transactions
 * - `0x3`: EIP-4844 transactions
 * - `0x4`: EIP-7702 transactions
 * - any other string
 */
export type TypeRpc =
  | TransactionLegacy.TypeRpc
  | TransactionEip1559.TypeRpc
  | TransactionEip2930.TypeRpc
  | TransactionEip4844.TypeRpc
  | TransactionEip7702.TypeRpc
  | (string & {})

/**
 * Converts an {@link ox#Transaction.Rpc} to an {@link ox#Transaction.Transaction}.
 *
 * @example
 * ```ts twoslash
 * import { Transaction } from 'ox'
 *
 * const transaction = Transaction.fromRpc({
 *   hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *   nonce: '0x357',
 *   blockHash:
 *     '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
 *   blockNumber: '0x12f296f',
 *   transactionIndex: '0x2',
 *   from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
 *   value: '0x9b6e64a8ec60000',
 *   gas: '0x43f5d',
 *   maxFeePerGas: '0x2ca6ae494',
 *   maxPriorityFeePerGas: '0x41cc3c0',
 *   input:
 *     '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006643504700000000000000000000000000000000000000000000000000000000000000040b080604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec600000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec60000000000000000000000000000000000000000000000000000019124bb5ae978c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b80000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c00000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000190240001b9872b',
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   yParity: '0x0',
 *   chainId: '0x1',
 *   accessList: [],
 *   type: '0x2',
 * })
 * ```
 *
 * @param transaction - The RPC transaction to convert.
 * @returns An instantiated {@link ox#Transaction.Transaction}.
 */
export function fromRpc<
  const transaction extends Rpc | null,
  pending extends boolean = false,
>(
  transaction: transaction | Rpc | null,
  _options: fromRpc.Options<pending> = {},
): transaction extends Rpc<pending> ? Transaction<pending> : null {
  if (!transaction) return null as never
  if ('type' in transaction) {
    if (transaction.type === '0x0')
      return TransactionLegacy.fromRpc(transaction as never)
    if (transaction.type === '0x1')
      return TransactionEip2930.fromRpc(transaction as never)
    if (transaction.type === '0x2')
      return TransactionEip1559.fromRpc(transaction as never)
    if (transaction.type === '0x3')
      return TransactionEip4844.fromRpc(transaction as never)
    if (transaction.type === '0x4')
      return TransactionEip7702.fromRpc(transaction as never)
    return {
      ...TransactionEip1559.fromRpc(transaction as any),
      ...(transaction as any),
    } as never
  }
  return TransactionLegacy.fromRpc(transaction)
}

export declare namespace fromRpc {
  type Options<pending extends boolean = false> = {
    pending?: pending | boolean | undefined
  }

  type ErrorType = Signature.extract.ErrorType | Errors.GlobalErrorType
}

fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as fromRpc.ErrorType

/**
 * Converts an {@link ox#Transaction.Transaction} to an {@link ox#Transaction.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { Transaction } from 'ox'
 *
 * const transaction = Transaction.toRpc({
 *   accessList: [],
 *   blockHash:
 *     '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
 *   blockNumber: 19868015n,
 *   chainId: 1,
 *   from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   gas: 278365n,
 *   hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *   input:
 *     '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006643504700000000000000000000000000000000000000000000000000000000000000040b080604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec600000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec60000000000000000000000000000000000000000000000000000019124bb5ae978c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b80000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c00000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000190240001b9872b',
 *   maxFeePerGas: 11985937556n,
 *   maxPriorityFeePerGas: 68993984n,
 *   nonce: 855n,
 *   r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
 *   s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
 *   to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
 *   transactionIndex: 2,
 *   type: 'eip1559',
 *   v: 27,
 *   value: 700000000000000000n,
 *   yParity: 0,
 * })
 * ```
 *
 * @param transaction - The transaction to convert.
 * @returns An RPC-formatted transaction.
 */
export function toRpc<pending extends boolean = false>(
  transaction: Transaction<pending>,
): Rpc<pending> {
  if (transaction.type === 'legacy')
    return TransactionLegacy.toRpc(transaction as never) as never
  if (transaction.type === 'eip2930')
    return TransactionEip2930.toRpc(transaction as never) as never
  if (transaction.type === 'eip1559')
    return TransactionEip1559.toRpc(transaction as never) as never
  if (transaction.type === 'eip4844')
    return TransactionEip4844.toRpc(transaction as never) as never
  if (transaction.type === 'eip7702')
    return TransactionEip7702.toRpc(transaction as never) as never
  throw new TypeNotImplementedError({
    type: (transaction as any).type,
  })
}

export declare namespace toRpc {
  type Options<pending extends boolean = false> = {
    pending?: pending | boolean | undefined
  }

  type ErrorType = Signature.extract.ErrorType | Errors.GlobalErrorType
}

toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as toRpc.ErrorType

/**
 * Thrown when a transaction type is not implemented.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Transaction } from 'ox'
 *
 * Transaction.toRpc({ type: 'foo' })
 * // @error: Transaction.TypeNotImplementedError: The provided transaction type `foo` is not implemented.
 * ```
 */
export class TypeNotImplementedError extends Errors.BaseError {
  override readonly name = 'Transaction.TypeNotImplementedError'
  constructor({ type }: { type: string }) {
    super(`The provided transaction type \`${type}\` is not implemented.`)
  }
}
