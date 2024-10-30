import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Signature from './Signature.js'
import type * as Transaction from './Transaction.js'
import type { Compute } from './internal/types.js'

/** An legacy Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionLegacy<
  pending extends boolean = false,
  bigintType = bigint,
  numberType = number,
  type extends string = Type,
> = Compute<
  Omit<
    Transaction.Base<type, pending, bigintType, numberType>,
    'chainId' | 'v' | 'yParity'
  > & {
    chainId?: numberType | undefined
    /** The gas price willing to be paid by the sender (in wei). */
    gasPrice: bigintType
    /** ECDSA signature v. */
    v: numberType
    /** ECDSA signature yParity. */
    yParity?: numberType | undefined
  }
>

/** A legacy RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Rpc<pending extends boolean = false> = Compute<
  TransactionLegacy<pending, Hex.Hex, Hex.Hex, TypeRpc>
>

export const type = 'legacy'
export type Type = typeof type

export const typeRpc = '0x0'
export type TypeRpc = typeof typeRpc

/**
 * Converts an {@link ox#TransactionLegacy.Rpc} to an {@link ox#TransactionLegacy.TransactionLegacy}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionLegacy } from 'ox'
 *
 * const transaction = TransactionLegacy.fromRpc({
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
 *   gasPrice: '0x2ca6ae494',
 *   input:
 *     '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006643504700000000000000000000000000000000000000000000000000000000000000040b080604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec600000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec60000000000000000000000000000000000000000000000000000019124bb5ae978c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b80000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c00000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000190240001b9872b',
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   v: '0x1b',
 *   chainId: '0x1',
 *   type: '0x0',
 * })
 * ```
 *
 * @param transaction - The Legacy RPC transaction to convert.
 * @returns An instantiated {@link ox#TransactionLegacy.TransactionLegacy}.
 */
export function fromRpc<
  const transaction extends Rpc<boolean> | null,
  pending extends boolean = false,
>(
  transaction: transaction | Rpc<boolean> | null,
  _options?: fromRpc.Options<pending>,
): transaction extends Rpc<pending> ? TransactionLegacy<pending> : null {
  if (!transaction) return null as never

  const signature = Signature.extract(transaction)!

  return {
    ...transaction,
    blockHash: transaction.blockHash ?? null,
    blockNumber: transaction.blockNumber
      ? BigInt(transaction.blockNumber)
      : null,
    chainId: transaction.chainId ? Number(transaction.chainId) : undefined,
    data: transaction.input,
    gas: BigInt(transaction.gas ?? 0n),
    gasPrice: BigInt(transaction.gasPrice ?? 0n),
    nonce: BigInt(transaction.nonce ?? 0n),
    transactionIndex: transaction.transactionIndex
      ? Number(transaction.transactionIndex)
      : null,
    type: 'legacy',
    value: BigInt(transaction.value ?? 0n),
    v: signature.yParity === 0 ? 27 : 28,
    ...signature,
  } as never
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
 * Converts an {@link ox#TransactionLegacy.TransactionLegacy} to an {@link ox#TransactionLegacy.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionLegacy } from 'ox'
 *
 * const transaction = TransactionLegacy.toRpc({
 *   blockHash:
 *     '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
 *   blockNumber: 19868015n,
 *   chainId: 1,
 *   from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   gas: 278365n,
 *   hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *   input:
 *     '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006643504700000000000000000000000000000000000000000000000000000000000000040b080604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec600000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec60000000000000000000000000000000000000000000000000000019124bb5ae978c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b80000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c00000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000190240001b9872b',
 *   gasPrice: 11985937556n,
 *   nonce: 855n,
 *   r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
 *   s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
 *   to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
 *   transactionIndex: 2,
 *   type: 'legacy',
 *   v: 27,
 *   value: 700000000000000000n,
 *   yParity: 0,
 * })
 * ```
 *
 * @param transaction - The legacy transaction to convert.
 * @returns An RPC-formatted legacy transaction.
 */
export function toRpc<pending extends boolean = false>(
  transaction: TransactionLegacy<pending>,
  _options?: toRpc.Options<pending>,
): Rpc<pending> {
  const signature = Signature.extract(transaction)!

  return {
    blockHash: transaction.blockHash ?? null,
    blockNumber:
      typeof transaction.blockNumber === 'bigint'
        ? Hex.fromNumber(transaction.blockNumber)
        : null,
    chainId:
      typeof transaction.chainId === 'number'
        ? Hex.fromNumber(transaction.chainId)
        : undefined,
    data: transaction.input,
    from: transaction.from,
    gas: Hex.fromNumber(transaction.gas ?? 0n),
    gasPrice: Hex.fromNumber(transaction.gasPrice ?? 0n),
    hash: transaction.hash,
    input: transaction.input,
    nonce: Hex.fromNumber(transaction.nonce ?? 0n),
    to: transaction.to,
    transactionIndex: transaction.transactionIndex
      ? Hex.fromNumber(transaction.transactionIndex)
      : null,
    type: '0x0',
    value: Hex.fromNumber(transaction.value ?? 0n),
    v: signature.yParity === 0 ? '0x1b' : '0x1c',
    ...Signature.toRpc(signature),
  } as Rpc as never
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
