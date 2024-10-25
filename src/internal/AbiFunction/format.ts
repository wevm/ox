import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type * as Errors from '../../Errors.js'
import type { AbiFunction } from './types.js'

/**
 * Formats an {@link ox#AbiFunction.AbiFunction} into a **Human Readable ABI Function**.
 *
 * @example
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const formatted = AbiFunction.format({
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
 * @param abiFunction - The ABI Function to format.
 * @returns The formatted ABI Function.
 */
export function format<const abiFunction extends AbiFunction>(
  abiFunction: abiFunction | AbiFunction,
): FormatAbiItem<abiFunction> {
  return formatAbiItem(abiFunction) as never
}

export declare namespace format {
  type ErrorType = Errors.GlobalErrorType
}

format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as format.ErrorType
