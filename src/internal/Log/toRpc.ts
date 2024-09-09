import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Log, Log_Rpc } from './types.js'

/**
 * Converts a {@link ox#Log.Log} to a {@link ox#Log.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { Log } from 'ox'
 *
 * const log = Log.toRpc({
 *   address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 *   blockHash:
 *     '0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4',
 *   blockNumber: 19760236n,
 *   data: '0x',
 *   logIndex: 271,
 *   removed: false,
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x0000000000000000000000000000000000000000000000000000000000000000',
 *     '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
 *     '0x000000000000000000000000000000000000000000000000000000000000025b',
 *   ],
 *   transactionHash:
 *     '0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93',
 *   transactionIndex: 145,
 * })
 * // @log: {
 * // @log:   address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 * // @log:   blockHash: '0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4',
 * // @log:   blockNumber: '0x012d846c',
 * // @log:   data: '0x',
 * // @log:   logIndex: '0x010f',
 * // @log:   removed: false,
 * // @log:   topics: [
 * // @log:     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 * // @log:     '0x0000000000000000000000000000000000000000000000000000000000000000',
 * // @log:     '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
 * // @log:     '0x000000000000000000000000000000000000000000000000000000000000025b',
 * // @log:   ],
 * // @log:   transactionHash:
 * // @log:     '0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93',
 * // @log:   transactionIndex: '0x91',
 * // @log: }
 * ```
 *
 * @param log - The log to convert.
 * @returns An RPC log.
 */
export function Log_toRpc(log: Log): Log_Rpc {
  return {
    address: log.address,
    blockHash: log.blockHash,
    blockNumber:
      typeof log.blockNumber === 'bigint' ? Hex_from(log.blockNumber) : null,
    data: log.data,
    logIndex: typeof log.logIndex === 'number' ? Hex_from(log.logIndex) : null,
    topics: log.topics,
    transactionHash: log.transactionHash,
    transactionIndex:
      typeof log.transactionIndex === 'number'
        ? Hex_from(log.transactionIndex)
        : null,
    removed: log.removed,
  }
}

export declare namespace Log_toRpc {
  export type ErrorType = GlobalErrorType
}

Log_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Log_toRpc.ErrorType
