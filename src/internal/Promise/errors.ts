import { BaseError } from '../Errors/base.js'

export class Promise_TimeoutError extends BaseError {
  override readonly name = 'Promise.TimeoutError'

  constructor() {
    super('Operation timed out.')
  }
}
