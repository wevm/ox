import { BaseError } from '../Errors/base.js'

export class InvalidDecimalNumberError extends BaseError {
  override readonly name = 'InvalidDecimalNumberError'
  constructor({ value }: { value: string }) {
    super(`Value \`${value}\` is not a valid decimal number.`)
  }
}
