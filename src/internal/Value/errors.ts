import { BaseError } from '../Errors/base.js'

export class Value_InvalidDecimalNumberError extends BaseError {
  override readonly name = 'Value.InvalidDecimalNumberError'
  constructor({ value }: { value: string }) {
    super(`Value \`${value}\` is not a valid decimal number.`)
  }
}
