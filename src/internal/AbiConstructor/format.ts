import { type FormatAbiItem, formatAbiItem } from 'abitype'

import type * as AbiConstructor from '../../AbiConstructor.js'
import type * as Errors from '../../Errors.js'

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
export function format<
  const abiConstructor extends AbiConstructor.AbiConstructor,
>(
  abiConstructor: abiConstructor | AbiConstructor.AbiConstructor,
): AbiConstructor.format.ReturnType<abiConstructor> {
  return formatAbiItem(abiConstructor) as never
}

export declare namespace format {
  type ReturnType<abiConstructor extends AbiConstructor.AbiConstructor> =
    FormatAbiItem<abiConstructor>

  type ErrorType = Errors.GlobalErrorType
}

format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor.format.ErrorType
