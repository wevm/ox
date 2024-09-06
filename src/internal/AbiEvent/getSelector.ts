import { AbiItem_getSignatureHash } from '../AbiItem/getSignatureHash.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
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
 * @returns The {@link ox#Hash.keccak256} hash of the event signature.
 */
export function AbiEvent_getSelector(abiItem: string | AbiEvent): Hex {
  return AbiItem_getSignatureHash(abiItem)
}

export declare namespace AbiEvent_getSelector {
  type ErrorType = AbiItem_getSignatureHash.ErrorType | GlobalErrorType
}

/* v8 ignore next */
AbiEvent_getSelector.parseError = (error: unknown) =>
  error as AbiEvent_getSelector.ErrorType
