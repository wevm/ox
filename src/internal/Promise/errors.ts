import { BaseError } from '../Errors/base.js'

/** Thrown when an operation times out. */
export class Promise_TimeoutError extends BaseError {
  override readonly name = 'Promise.TimeoutError'

  constructor() {
    super('Operation timed out.')
  }
}
