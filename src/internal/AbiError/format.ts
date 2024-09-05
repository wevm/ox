import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type { GlobalErrorType } from '../Errors/error.js'
import type { AbiError } from './types.js'

/**
 * Formats an {@link AbiError#AbiError} into a **Human Readable ABI Error**.
 *
 * @example
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const formatted = AbiError.format({
 *   type: 'error',
 *   name: 'Example',
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
 * })
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param abiError - The ABI Error to format.
 * @returns The formatted ABI Error.
 */
export function AbiError_format<const abiError extends AbiError>(
  abiError: abiError | AbiError,
): FormatAbiItem<abiError> {
  return formatAbiItem(abiError) as never
}

export declare namespace AbiError_format {
  type ErrorType = GlobalErrorType
}

AbiError_format.parseError = (error: unknown) =>
  /** v8 ignore next */
  error as AbiError_format.ErrorType
