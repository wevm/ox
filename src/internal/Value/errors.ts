import { BaseError } from '../Errors/base.js'

/**
 * Thrown when a value is not a valid decimal number.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.fromEther('123.456.789')
 * // @error: Value.InvalidDecimalNumberError: Value `123.456.789` is not a valid decimal number.
 * ```
 */
export class Value_InvalidDecimalNumberError extends BaseError {
  override readonly name = 'Value.InvalidDecimalNumberError'
  constructor({ value }: { value: string }) {
    super(`Value \`${value}\` is not a valid decimal number.`)
  }
}
