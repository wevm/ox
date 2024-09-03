import { type ParseAbiParameters, parseAbiParameters } from 'abitype'
import type { GlobalErrorType } from '../Errors/error.js'
import type { AbiParameters } from './types.js'

/**
 * Parses arbitrary **JSON ABI Parameters** or **Human Readable ABI Parameters** into typed {@link ox#AbiParameters.AbiParameters}.
 *
 * @example
 * ### JSON Parameters
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const parameters = AbiParameters.from([
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
 * parameters
 * //^?
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Human Readable Parameters
 *
 * Human Readable ABI Parameters can be parsed into a typed {@link ox#AbiParameters.AbiParameters}:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const parameters = AbiParameters.from('address spender, uint256 amount')
 *
 * parameters
 * //^?
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * It is possible to specify `struct`s along with your definitions:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const parameters = AbiParameters.from([
 *   'struct Foo { address spender; uint256 amount; }', // [!code hl]
 *   'Foo foo, address bar',
 * ])
 *
 * parameters
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 *
 *
 * @param parameters - The ABI Parameters to parse.
 * @returns The typed ABI Parameters.
 */
export function AbiParameters_from<
  const parameters extends AbiParameters | string | readonly string[],
>(
  parameters: parameters | AbiParameters | string | readonly string[],
): AbiParameters_from.ReturnType<parameters> {
  if (Array.isArray(parameters) && typeof parameters[0] === 'string')
    return parseAbiParameters(parameters) as never
  if (typeof parameters === 'string')
    return parseAbiParameters(parameters) as never
  return parameters as never
}

export declare namespace AbiParameters_from {
  type ReturnType<
    parameters extends AbiParameters | string | readonly string[],
  > = parameters extends string
    ? ParseAbiParameters<parameters>
    : parameters extends readonly string[]
      ? ParseAbiParameters<parameters>
      : parameters

  type ErrorType = GlobalErrorType
}

AbiParameters_from.parseError = (error: unknown) =>
  /** v8 ignore next */
  error as AbiParameters_from.ErrorType
