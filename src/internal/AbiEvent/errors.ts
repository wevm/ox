import { BaseError } from '../Errors/base.js'

export class FilterTypeNotSupportedError extends BaseError {
  override readonly name = 'FilterTypeNotSupportedError'
  constructor(type: string) {
    super(`Filter type "${type}" is not supported.`)
  }
}
