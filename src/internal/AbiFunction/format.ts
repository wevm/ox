import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type { Errors } from '../../Errors.js'
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
export function AbiFunction_format<const abiFunction extends AbiFunction>(
  abiFunction: abiFunction | AbiFunction,
): FormatAbiItem<abiFunction> {
  return formatAbiItem(abiFunction) as never
}

export declare namespace AbiFunction_format {
  type ErrorType = Errors.GlobalErrorType
}

AbiFunction_format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiFunction_format.ErrorType
