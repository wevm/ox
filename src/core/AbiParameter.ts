import type * as abitype from 'abitype'
import type * as Errors from './Errors.js'
import * as formatAbiParameter from './internal/human-readable/formatAbiParameter.js'
import * as parseAbiParameter from './internal/human-readable/parseAbiParameter.js'

/** Root type for an ABI parameter. */
export type AbiParameter = abitype.AbiParameter

/** A parameter on an ABI event. */
export type AbiEventParameter = abitype.AbiEventParameter

export {
  InvalidAbiParameterError,
  InvalidAbiTypeParameterError,
  InvalidFunctionModifierError,
  InvalidModifierError,
  InvalidParameterError,
  SolidityProtectedKeywordError,
} from './internal/human-readable/errors.js'
export { InvalidParenthesisError } from './internal/human-readable/errors.js'

/**
 * Formats an {@link ox#AbiParameter.AbiParameter} into a **Human Readable ABI Parameter**.
 *
 * @example
 * ```ts twoslash
 * import { AbiParameter } from 'ox'
 *
 * const formatted = AbiParameter.format({
 *   name: 'spender',
 *   type: 'address'
 * })
 *
 * formatted
 * //    ^?
 * ```
 *
 * @param parameter - The ABI Parameter to format.
 * @returns The formatted ABI Parameter.
 */
export function format<const parameter extends AbiParameter | AbiEventParameter>(
  parameter: parameter | AbiParameter | AbiEventParameter,
): format.ReturnType<parameter> {
  return formatAbiParameter.formatAbiParameter(parameter as parameter) as never
}

export declare namespace format {
  type ReturnType<
    parameter extends AbiParameter | AbiEventParameter = AbiParameter,
  > = formatAbiParameter.FormatAbiParameter<parameter>

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses an arbitrary **JSON ABI Parameter** or **Human Readable ABI Parameter** into a typed {@link ox#AbiParameter.AbiParameter}.
 *
 * @example
 * ### JSON Parameters
 *
 * ```ts twoslash
 * import { AbiParameter } from 'ox'
 *
 * const parameter = AbiParameter.from({
 *   name: 'spender',
 *   type: 'address'
 * })
 *
 * parameter
 * //^?
 * ```
 *
 * @example
 * ### Human Readable Parameters
 *
 * ```ts twoslash
 * import { AbiParameter } from 'ox'
 *
 * const parameter = AbiParameter.from('address spender')
 *
 * parameter
 * //^?
 * ```
 *
 * @example
 * It is possible to specify `struct`s along with your definition:
 *
 * ```ts twoslash
 * import { AbiParameter } from 'ox'
 *
 * const parameter = AbiParameter.from([
 *   'struct Foo { address spender; uint256 amount; }',
 *   'Foo foo'
 * ])
 *
 * parameter
 * //^?
 * ```
 *
 * @param parameter - The ABI Parameter to parse.
 * @returns The typed ABI Parameter.
 */
export function from<
  const parameter extends AbiParameter | string | readonly string[],
>(
  parameter: parameter | AbiParameter | string | readonly string[],
): from.ReturnType<parameter> {
  if (Array.isArray(parameter))
    return parseAbiParameter.parseAbiParameter(parameter) as never
  if (typeof parameter === 'string')
    return parseAbiParameter.parseAbiParameter(parameter) as never
  return parameter as never
}

export declare namespace from {
  type ReturnType<parameter extends AbiParameter | string | readonly string[]> =
    parameter extends string
      ? parseAbiParameter.ParseAbiParameter<parameter>
      : parameter extends readonly string[]
        ? parseAbiParameter.ParseAbiParameter<parameter>
        : parameter

  type ErrorType = Errors.GlobalErrorType
}
