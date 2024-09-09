import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import { Transaction_toRpc } from '../Transaction/isomorphic/toRpc.js'
import { Withdrawal_toRpc } from '../Withdrawal/toRpc.js'
import type { Block, Block_Rpc } from './types.js'

/**
 * Converts a {@link ox#Block.Block} to an {@link ox#Block.Rpc}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Block } from 'ox'
 *
 * const block = Block.toRpc({
 *   // ...
 *   hash: '0xebc3644804e4040c0a74c5a5bbbc6b46a71a5d4010fe0c92ebb2fdf4a43ea5dd',
 *   number: 19868020n,
 *   size: 520n
 *   timestamp: 1662222222n,
 *   // ...
 * })
 * // @log: {
 * // @log:   // ...
 * // @log:   hash: '0xebc3644804e4040c0a74c5a5bbbc6b46a71a5d4010fe0c92ebb2fdf4a43ea5dd',
 * // @log:   number: '0xec6fc6',
 * // @log:   size: '0x208',
 * // @log:   timestamp: '0x63198f6f',
 * // @log:   // ...
 * // @log: }
 * ```
 *
 * @param block - The Block to convert.
 * @returns An RPC Block.
 */
export function Block_toRpc(block: Block): Block_Rpc {
  const transactions = block.transactions.map((transaction) => {
    if (typeof transaction === 'string') return transaction
    return Transaction_toRpc(transaction) as any
  })
  return {
    baseFeePerGas:
      typeof block.baseFeePerGas === 'bigint'
        ? Hex_from(block.baseFeePerGas)
        : undefined,
    blobGasUsed:
      typeof block.blobGasUsed === 'bigint'
        ? Hex_from(block.blobGasUsed)
        : undefined,
    excessBlobGas:
      typeof block.excessBlobGas === 'bigint'
        ? Hex_from(block.excessBlobGas)
        : undefined,
    extraData: block.extraData,
    difficulty:
      typeof block.difficulty === 'bigint'
        ? Hex_from(block.difficulty)
        : undefined,
    gasLimit: Hex_from(block.gasLimit),
    gasUsed: Hex_from(block.gasUsed),
    hash: block.hash,
    logsBloom: block.logsBloom,
    miner: block.miner,
    mixHash: block.mixHash,
    nonce: block.nonce,
    number: typeof block.number === 'bigint' ? Hex_from(block.number) : null,
    parentBeaconBlockRoot: block.parentBeaconBlockRoot,
    parentHash: block.parentHash,
    receiptsRoot: block.receiptsRoot,
    sealFields: block.sealFields,
    sha3Uncles: block.sha3Uncles,
    size: Hex_from(block.size),
    stateRoot: block.stateRoot,
    timestamp: Hex_from(block.timestamp),
    totalDifficulty:
      typeof block.totalDifficulty === 'bigint'
        ? Hex_from(block.totalDifficulty)
        : undefined,
    transactions,
    transactionsRoot: block.transactionsRoot,
    uncles: block.uncles,
    withdrawals: block.withdrawals?.map(Withdrawal_toRpc),
    withdrawalsRoot: block.withdrawalsRoot,
  }
}

export declare namespace Block_toRpc {
  export type ErrorType = GlobalErrorType
}

Block_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Block_toRpc.ErrorType
