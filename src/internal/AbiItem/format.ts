import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'

/**
 * Formats an {@link ox#AbiItem.AbiItem} into a **Human Readable ABI Item**.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const formatted = AbiItem.format({
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * })
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param abiItem - The ABI Item to format.
 * @returns The formatted ABI Item  .
 */
export function format<const abiItem extends AbiItem.AbiItem>(
  abiItem: abiItem | AbiItem.AbiItem,
): FormatAbiItem<abiItem> {
  return formatAbiItem(abiItem) as never
}

export declare namespace format {
  type ErrorType = Errors.GlobalErrorType
}

format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as format.ErrorType
