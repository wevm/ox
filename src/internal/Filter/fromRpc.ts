import type * as Errors from '../../Errors.js'
import { Hex_validate } from '../Hex/validate.js'
import type { Filter, Filter_Rpc } from './types.js'

/**
 * Converts a {@link ox#Log.Rpc} to an {@link ox#Log.Log}.
 *
 * @example
 * ```ts twoslash
 * import { Filter } from 'ox'
 *
 * const filter = Filter.fromRpc({
 *   address: '0xd3cda913deb6f67967b99d671a681250403edf27',
 *   fromBlock: 'latest',
 *   toBlock: '0x010f2c',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     null,
 *     '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
 *   ],
 * })
 * // @log: {
 * // @log:   address: '0xd3cda913deb6f67967b99d671a681250403edf27',
 * // @log:   fromBlock: 'latest',
 * // @log:   toBlock: 69420n,
 * // @log:   topics: [
 * // @log:     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 * // @log:     null,
 * // @log:     '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
 * // @log:   ],
 * // @log: }
 * ```
 *
 * @param log - The RPC log to convert.
 * @returns An instantiated {@link ox#Log.Log}.
 */
export function Filter_fromRpc(filter: Filter_Rpc): Filter {
  const { address, topics, fromBlock, toBlock } = filter
  return {
    ...(address && { address }),
    ...(topics && { topics }),
    ...(fromBlock && {
      fromBlock: Hex_validate(fromBlock, { strict: false })
        ? BigInt(fromBlock)
        : fromBlock,
    }),
    ...(toBlock && {
      toBlock: Hex_validate(toBlock, { strict: false })
        ? BigInt(toBlock)
        : toBlock,
    }),
  }
}

export declare namespace Filter_fromRpc {
  type ErrorType = Errors.GlobalErrorType
}

Filter_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Filter_fromRpc.ErrorType
