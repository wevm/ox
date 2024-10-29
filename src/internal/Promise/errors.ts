import * as Errors from '../../Errors.js'

/** Thrown when an operation times out. */
export class Promise_TimeoutError extends Errors.BaseError {
  override readonly name = 'Promise.TimeoutError'

  constructor() {
    super('Operation timed out.')
  }
}
