import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromNumber } from '../Hex/from.js'
import { Log_toRpc } from '../Log/toRpc.js'
import { TransactionReceipt_statusRpc } from './constants.js'
import type { TransactionReceipt, TransactionReceipt_Rpc } from './types.js'

/**
 * Converts a {@link ox#TransactionReceipt.TransactionReceipt} to a {@link ox#TransactionReceipt.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionReceipt } from 'ox'
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
export function TransactionReceipt_toRpc(
  receipt: TransactionReceipt,
): TransactionReceipt_Rpc {
  return {
    blobGasPrice: receipt.blobGasPrice
      ? Hex_fromNumber(receipt.blobGasPrice)
      : undefined,
    blobGasUsed: receipt.blobGasUsed
      ? Hex_fromNumber(receipt.blobGasUsed)
      : undefined,
    blockHash: receipt.blockHash,
    blockNumber: Hex_fromNumber(receipt.blockNumber),
    contractAddress: receipt.contractAddress,
    cumulativeGasUsed: Hex_fromNumber(receipt.cumulativeGasUsed),
    effectiveGasPrice: Hex_fromNumber(receipt.effectiveGasPrice),
    from: receipt.from,
    gasUsed: Hex_fromNumber(receipt.gasUsed),
    logs: receipt.logs.map(Log_toRpc as never),
    logsBloom: receipt.logsBloom,
    root: receipt.root,
    status: TransactionReceipt_statusRpc[receipt.status],
    to: receipt.to,
    transactionHash: receipt.transactionHash,
    transactionIndex: Hex_fromNumber(receipt.transactionIndex),
    type: receipt.type,
  }
}

export declare namespace TransactionReceipt_toRpc {
  export type ErrorType = Hex_fromNumber.ErrorType | GlobalErrorType
}

TransactionReceipt_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionReceipt_toRpc.ErrorType
