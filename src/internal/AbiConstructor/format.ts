import { type FormatAbiItem, formatAbiItem } from 'abitype'
import type { Errors } from '../../Errors.js'
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
export function AbiConstructor_format<
  const abiConstructor extends AbiConstructor,
>(
  abiConstructor: abiConstructor | AbiConstructor,
): FormatAbiItem<abiConstructor> {
  return formatAbiItem(abiConstructor) as never
}

export declare namespace AbiConstructor_format {
  type ErrorType = Errors.GlobalErrorType
}

AbiConstructor_format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor_format.ErrorType
