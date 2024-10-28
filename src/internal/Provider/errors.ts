import { Errors } from '../../Errors.js'

/** Thrown when the provider is undefined. */
export class Provider_IsUndefinedError extends Errors.BaseError {
  override readonly name = 'Provider.IsUndefinedError'

  constructor() {
    super('`provider` is undefined.')
  }
}
