import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type * as Errors from '../../Errors.js'
import type { AbiEvent } from './types.js'

/**
 * Formats an {@link ox#AbiEvent.AbiEvent} into a **Human Readable ABI Error**.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const formatted = AbiEvent.format({
 *   type: 'event',
 *   name: 'Transfer',
 *   inputs: [
 *     { name: 'from', type: 'address', indexed: true },
 *     { name: 'to', type: 'address', indexed: true },
 *     { name: 'value', type: 'uint256' },
 *   ],
 * })
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param abiEvent - The ABI Event to format.
 * @returns The formatted ABI Event.
 */
export function format<const abiEvent extends AbiEvent>(
  abiEvent: abiEvent | AbiEvent,
): FormatAbiItem<abiEvent> {
  return formatAbiItem(abiEvent) as never
}

export declare namespace format {
  type ErrorType = Errors.GlobalErrorType
}

format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as format.ErrorType
