import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import type { AbiEvent } from './types.js'

/**
 * Computes the event selector (hash of event signature) for an {@link ox#AbiEvent.AbiEvent}.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const selector = AbiEvent.getSelector('event Transfer(address indexed from, address indexed to, uint256 value)')
 * // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f556a2'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const selector = AbiEvent.getSelector({
 *   name: 'Transfer',
 *   type: 'event',
 *   inputs: [
 *     { name: 'from', type: 'address', indexed: true },
 *     { name: 'to', type: 'address', indexed: true },
 *     { name: 'value', type: 'uint256' }
 *   ]
 * })
 * // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f556a2'
 * ```
 *
 * @param abiItem - The ABI event to compute the selector for.
 * @returns The {@link ox#Hash.(keccak256:function)} hash of the event signature.
 */
export function getSelector(abiItem: string | AbiEvent): Hex.Hex {
  return AbiItem.getSignatureHash(abiItem)
}

export declare namespace getSelector {
  type ErrorType = AbiItem.getSignatureHash.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
getSelector.parseError = (error: unknown) => error as getSelector.ErrorType
