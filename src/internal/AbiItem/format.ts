import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type { GlobalErrorType } from '../Errors/error.js'
import type { AbiItem } from './types.js'

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
export function AbiItem_format<const abiItem extends AbiItem>(
  abiItem: abiItem | AbiItem,
): FormatAbiItem<abiItem> {
  return formatAbiItem(abiItem) as never
}

export declare namespace AbiItem_format {
  type ErrorType = GlobalErrorType
}

AbiItem_format.parseError = (error: unknown) =>
  /** v8 ignore next */
  error as AbiItem_format.ErrorType
