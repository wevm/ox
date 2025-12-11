import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as ox_TransactionReceipt from '../core/TransactionReceipt.js'

/**
 * Tempo transaction receipt.
 *
 * Extends standard receipts with `feePayer` (the address that paid fees) and
 * `feeToken` (the TIP-20 token used for fee payment).
 *
 * @see {@link https://docs.tempo.xyz/protocol/transactions Tempo Transactions}
 */
export type TransactionReceipt<
  status = ox_TransactionReceipt.Status,
  type = ox_TransactionReceipt.Type,
  bigintType = bigint,
  numberType = number,
> = Compute<
  ox_TransactionReceipt.TransactionReceipt<
    status,
    type,
    bigintType,
    numberType
  > & {
    /** Address of the fee payer. */
    feePayer?: Address.Address | undefined
    /** Address of the fee token. */
    feeToken?: Address.Address | undefined
  }
>

export type Rpc = TransactionReceipt<
  ox_TransactionReceipt.RpcStatus,
  ox_TransactionReceipt.RpcType,
  Hex.Hex,
  Hex.Hex
>

export type Type = 'tempo' | ox_TransactionReceipt.Type

export type RpcType = '0x76' | ox_TransactionReceipt.RpcType

export type Status = ox_TransactionReceipt.Status

export type RpcStatus = ox_TransactionReceipt.RpcStatus

/** RPC type to type mapping. */
export const fromRpcType = {
  ...ox_TransactionReceipt.fromRpcType,
  '0x76': 'tempo',
} as const

/** Type to RPC type mapping. */
export const toRpcType = {
  ...ox_TransactionReceipt.toRpcType,
  tempo: '0x76',
} as const

/**
 * Converts an RPC receipt to a TransactionReceipt.
 *
 * @see {@link https://docs.tempo.xyz/protocol/transactions Tempo Transactions}
 *
 * @example
 * ```ts twoslash
 * import { TransactionReceipt } from 'ox/tempo'
 *
 * const receipt = TransactionReceipt.fromRpc({
 *   blobGasPrice: '0x42069',
 *   blobGasUsed: '0x1337',
 *   blockHash:
 *     '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
 *   blockNumber: '0x12f296f',
 *   contractAddress: null,
 *   cumulativeGasUsed: '0x82515',
 *   effectiveGasPrice: '0x21c2f6c09',
 *   feePayer: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   feeToken: '0x20c0000000000000000000000000000000000001',
 *   from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   gasUsed: '0x2abba',
 *   logs: [],
 *   logsBloom:
 *     '0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000',
 *   status: '0x1',
 *   to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
 *   transactionHash:
 *     '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *   transactionIndex: '0x2',
 *   type: '0x2',
 * })
 * // @log: {
 * // @log:   blobGasPrice: 270441n,
 * // @log:   blobGasUsed: 4919n,
 * // @log:   blockHash: "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
 * // @log:   blockNumber: 19868015n,
 * // @log:   contractAddress: null,
 * // @log:   cumulativeGasUsed: 533781n,
 * // @log:   effectiveGasPrice: 9062804489n,
 * // @log:   feePayer: "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
 * // @log:   feeToken: "0x20c0000000000000000000000000000000000001",
 * // @log:   from: "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
 * // @log:   gasUsed: 175034n,
 * // @log:   logs: [],
 * // @log:   logsBloom: "0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000",
 * // @log:   root: undefined,
 * // @log:   status: "success",
 * // @log:   to: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
 * // @log:   transactionHash: "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
 * // @log:   transactionIndex: 2,
 * // @log:   type: "eip1559",
 * // @log: }
 * ```
 *
 * @param receipt - The RPC receipt to convert.
 * @returns A TransactionReceipt.
 */
export function fromRpc<const receipt extends Rpc | null>(
  receipt: receipt | Rpc | null,
): receipt extends Rpc ? TransactionReceipt : null {
  return ox_TransactionReceipt.fromRpc(
    receipt as ox_TransactionReceipt.Rpc,
  ) as never
}

export declare namespace fromRpc {
  export type ErrorType = ox_TransactionReceipt.fromRpc.ErrorType
}

/**
 * Converts a TransactionReceipt to an RPC receipt.
 *
 * @example
 * ```ts twoslash
 * import { TransactionReceipt } from 'ox/tempo'
 *
 * const receipt = TransactionReceipt.toRpc({
 *   blobGasPrice: 270441n,
 *   blobGasUsed: 4919n,
 *   blockHash:
 *     '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
 *   blockNumber: 19868015n,
 *   contractAddress: null,
 *   cumulativeGasUsed: 533781n,
 *   effectiveGasPrice: 9062804489n,
 *   feePayer: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   feeToken: '0x20c0000000000000000000000000000000000001',
 *   from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   gasUsed: 175034n,
 *   logs: [],
 *   logsBloom:
 *     '0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000',
 *   root: undefined,
 *   status: 'success',
 *   to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
 *   transactionHash:
 *     '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *   transactionIndex: 2,
 *   type: 'eip1559',
 * })
 * // @log: {
 * // @log:   blobGasPrice: "0x042069",
 * // @log:   blobGasUsed: "0x1337",
 * // @log:   blockHash: "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
 * // @log:   blockNumber: "0x012f296f",
 * // @log:   contractAddress: null,
 * // @log:   cumulativeGasUsed: "0x082515",
 * // @log:   effectiveGasPrice: "0x021c2f6c09",
 * // @log:   feePayer: "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
 * // @log:   feeToken: "0x20c0000000000000000000000000000000000001",
 * // @log:   from: "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
 * // @log:   gasUsed: "0x02abba",
 * // @log:   logs: [],
 * // @log:   logsBloom: "0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000",
 * // @log:   root: undefined,
 * // @log:   status: "0x1",
 * // @log:   to: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
 * // @log:   transactionHash: "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
 * // @log:   transactionIndex: "0x02",
 * // @log:   type: "eip1559",
 * // @log: }
 * ```
 *
 * @param receipt - The receipt to convert.
 * @returns An RPC receipt.
 */
export function toRpc(receipt: TransactionReceipt): Rpc {
  const rpc = ox_TransactionReceipt.toRpc(
    receipt as ox_TransactionReceipt.TransactionReceipt,
  ) as Rpc
  return {
    ...rpc,
    feePayer: receipt.feePayer,
    feeToken: receipt.feeToken,
  }
}

export declare namespace toRpc {
  export type ErrorType = ox_TransactionReceipt.toRpc.ErrorType
}
