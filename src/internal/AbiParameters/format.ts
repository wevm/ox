import {
  type AbiEventParameter,
  type AbiParameter,
  type FormatAbiParameters,
  formatAbiParameters,
} from 'abitype'
import type * as Errors from '../../Errors.js'

/**
 * Formats {@link ox#AbiParameters.AbiParameters} into **Human Readable ABI Parameters**.
 *
 * @example
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const formatted = AbiParameters.format([
 *   {
 *     name: 'spender',
 *     type: 'address',
 *   },
 *   {
 *     name: 'amount',
 *     type: 'uint256',
 *   },
 * ])
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param parameters - The ABI Parameters to format.
 * @returns The formatted ABI Parameters  .
 */
export function format<
  const parameters extends readonly [
    AbiParameter | AbiEventParameter,
    ...(readonly (AbiParameter | AbiEventParameter)[]),
  ],
>(
  parameters:
    | parameters
    | readonly [
        AbiParameter | AbiEventParameter,
        ...(readonly (AbiParameter | AbiEventParameter)[]),
      ],
): FormatAbiParameters<parameters> {
  return formatAbiParameters(parameters)
}

export declare namespace format {
  type ErrorType = Errors.GlobalErrorType
}

format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as format.ErrorType
