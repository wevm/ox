import type { GlobalErrorType } from '../Errors/error.js'
import { Log_fromRpc } from '../Log/fromRpc.js'
import {
  TransactionReceipt_status,
  TransactionReceipt_type,
} from './constants.js'
import type { TransactionReceipt, TransactionReceipt_Rpc } from './types.js'

/**
 * Converts a {@link ox#TransactionReceipt.Rpc} to an {@link ox#TransactionReceipt.TransactionReceipt}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionReceipt } from 'ox'
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
 * @example
 * ### End-to-end
 *
 * Below is an example of how to use the `TransactionReceipt.fromRpc` method to convert an RPC transaction receipt to a {@link ox#TransactionReceipt.TransactionReceipt} object.
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { TransactionReceipt } from 'ox'
 *
 * const receipt = await window.ethereum!
 *   .request({
 *     method: 'eth_getTransactionReceipt',
 *     params: [
 *       '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *     ],
 *   })
 *   .then(TransactionReceipt.fromRpc) // [!code hl]
 * // @log: {
 * // @log:   blobGasPrice: 270441n,
 * // @log:   blobGasUsed: 4919n,
 * // @log:   blockHash: "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
 * // @log:   blockNumber: 19868015n,
 * // @log:   contractAddress: null,
 * // @log:   cumulativeGasUsed: 533781n,
 * // @log:   effectiveGasPrice: 9062804489n,
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
 * :::note
 *
 * For simplicity, the above example uses `window.ethereum.request`, but you can use any
 * type of JSON-RPC interface.
 *
 * :::
 *
 * @param receipt - The RPC receipt to convert.
 * @returns An instantiated {@link ox#TransactionReceipt.TransactionReceipt}.
 */
export function TransactionReceipt_fromRpc<
  const receipt extends TransactionReceipt_Rpc | null,
>(
  receipt: receipt | TransactionReceipt_Rpc | null,
): receipt extends TransactionReceipt_Rpc ? TransactionReceipt : null {
  if (!receipt) return null as never

  return {
    blobGasPrice: receipt.blobGasPrice
      ? BigInt(receipt.blobGasPrice)
      : undefined,
    blobGasUsed: receipt.blobGasUsed ? BigInt(receipt.blobGasUsed) : undefined,
    blockHash: receipt.blockHash,
    blockNumber: BigInt(receipt.blockNumber ?? 0n),
    contractAddress: receipt.contractAddress,
    cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed ?? 0n),
    effectiveGasPrice: BigInt(receipt.effectiveGasPrice ?? 0n),
    from: receipt.from,
    gasUsed: BigInt(receipt.gasUsed ?? 0n),
    logs: receipt.logs.map(Log_fromRpc),
    logsBloom: receipt.logsBloom,
    status: TransactionReceipt_status[receipt.status],
    to: receipt.to,
    transactionHash: receipt.transactionHash,
    transactionIndex: Number(receipt.transactionIndex ?? 0),
    type: (TransactionReceipt_type as any)[receipt.type] || receipt.type,
    root: receipt.root,
  } as never
}

export declare namespace TransactionReceipt_fromRpc {
  export type ErrorType = Log_fromRpc.ErrorType | GlobalErrorType
}

TransactionReceipt_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionReceipt_fromRpc.ErrorType