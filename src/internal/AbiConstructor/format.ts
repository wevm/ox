import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type * as Errors from '../../Errors.js'
import type { AbiConstructor } from './types.js'

/**
 * Formats an {@link ox#AbiConstructor.AbiConstructor} into a **Human Readable ABI Function**.
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const formatted = AbiConstructor.format({
 *   inputs: [
 *     { name: 'owner', type: 'address' },
 *   ],
 *   payable: false,
 *   stateMutability: 'nonpayable',
 *   type: 'constructor',
 * })
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param abiConstructor - The ABI Constructor to format.
 * @returns The formatted ABI Constructor.
 */
export function format<const abiConstructor extends AbiConstructor>(
  abiConstructor: abiConstructor | AbiConstructor,
): FormatAbiItem<abiConstructor> {
  return formatAbiItem(abiConstructor) as never
}

export declare namespace format {
  type ErrorType = Errors.GlobalErrorType
}

format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as format.ErrorType
