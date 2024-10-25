import type * as Errors from '../../Errors.js'
import { fromNumber } from '../Hex/fromNumber.js'
import type { Filter, Filter_Rpc } from './types.js'

/**
 * Converts a {@link ox#Filter.Filter} to a {@link ox#Filter.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent, Filter } from 'ox'
 *
 * const transfer = AbiEvent.from('event Transfer(address indexed, address indexed, uint256)')
 * const { topics } = AbiEvent.encode(transfer)
 *
 * const filter = Filter.toRpc({
 *   address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 *   topics,
 * })
 * // @log: {
 * // @log:   address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 * // @log:   topics: [
 * // @log:     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 * // @log:   ],
 * // @log: }
 * ```
 *
 * @param filter - The filter to convert.
 * @returns An RPC filter.
 */
export function Filter_toRpc(filter: Filter): Filter_Rpc {
  const { address, topics, fromBlock, toBlock } = filter
  return {
    ...(address && { address }),
    ...(topics && { topics }),
    ...(typeof fromBlock !== 'undefined'
      ? {
          fromBlock:
            typeof fromBlock === 'bigint' ? fromNumber(fromBlock) : fromBlock,
        }
      : {}),
    ...(typeof toBlock !== 'undefined'
      ? {
          toBlock: typeof toBlock === 'bigint' ? fromNumber(toBlock) : toBlock,
        }
      : {}),
  }
}

export declare namespace Filter_toRpc {
  type ErrorType = Errors.GlobalErrorType
}

Filter_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Filter_toRpc.ErrorType
