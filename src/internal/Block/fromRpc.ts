import type * as Errors from '../../Errors.js'
import { Transaction_fromRpc } from '../Transaction/isomorphic/fromRpc.js'
import { Withdrawal_fromRpc } from '../Withdrawal/fromRpc.js'
import type { Block, Block_Rpc, Block_Tag } from './types.js'

/**
 * Converts a {@link ox#Block.Rpc} to an {@link ox#Block.Block}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Block } from 'ox'
 *
 * const block = Block.fromRpc({
 *   // ...
 *   hash: '0xebc3644804e4040c0a74c5a5bbbc6b46a71a5d4010fe0c92ebb2fdf4a43ea5dd',
 *   number: '0xec6fc6',
 *   size: '0x208',
 *   timestamp: '0x63198f6f',
 *   // ...
 * })
 * // @log: {
 * // @log:   // ...
 * // @log:   hash: '0xebc3644804e4040c0a74c5a5bbbc6b46a71a5d4010fe0c92ebb2fdf4a43ea5dd',
 * // @log:   number: 19868020n,
 * // @log:   size: 520n,
 * // @log:   timestamp: 1662222222n,
 * // @log:   // ...
 * // @log: }
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `Block.fromRpc` to fetch a block from the network and convert it to an {@link ox#Block.Block}.
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { Block } from 'ox'
 *
 * const block = await window.ethereum!
 *   .request({
 *     method: 'eth_getBlockByNumber',
 *     params: ['latest', false],
 *   })
 *   .then(Block.fromRpc) // [!code hl]
 * // @log: {
 * // @log:   // ...
 * // @log:   hash: '0xebc3644804e4040c0a74c5a5bbbc6b46a71a5d4010fe0c92ebb2fdf4a43ea5dd',
 * // @log:   number: 19868020n,
 * // @log:   size: 520n,
 * // @log:   timestamp: 1662222222n,
 * // @log:   // ...
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
 * @param block - The RPC block to convert.
 * @returns An instantiated {@link ox#Block.Block}.
 */
export function Block_fromRpc<
  const block extends Block_Rpc | null,
  includeTransactions extends boolean = false,
  blockTag extends Block_Tag = 'latest',
>(
  block: block | Block_Rpc | null,
  _options: Block_fromRpc.Options<includeTransactions, blockTag> = {},
): block extends Block_Rpc ? Block<includeTransactions, blockTag> : null {
  if (!block) return null as never

  const transactions = block.transactions.map((transaction) => {
    if (typeof transaction === 'string') return transaction
    return Transaction_fromRpc(transaction) as any
  })
  return {
    ...block,
    baseFeePerGas: block.baseFeePerGas
      ? BigInt(block.baseFeePerGas)
      : undefined,
    blobGasUsed: block.blobGasUsed ? BigInt(block.blobGasUsed) : undefined,
    difficulty: block.difficulty ? BigInt(block.difficulty) : undefined,
    excessBlobGas: block.excessBlobGas
      ? BigInt(block.excessBlobGas)
      : undefined,
    gasLimit: BigInt(block.gasLimit ?? 0n),
    gasUsed: BigInt(block.gasUsed ?? 0n),
    number: block.number ? BigInt(block.number) : null,
    size: BigInt(block.size ?? 0n),
    stateRoot: block.stateRoot,
    timestamp: BigInt(block.timestamp ?? 0n),
    totalDifficulty: BigInt(block.totalDifficulty ?? 0n),
    transactions,
    withdrawals: block.withdrawals?.map(Withdrawal_fromRpc),
  } as Block as never
}

export declare namespace Block_fromRpc {
  type Options<
    includeTransactions extends boolean = false,
    blockTag extends Block_Tag = 'latest',
  > = {
    blockTag?: blockTag | Block_Tag | undefined
    includeTransactions?: includeTransactions | boolean | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

Block_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Block_fromRpc.ErrorType
