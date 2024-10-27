import { BaseError } from '../Errors/base.js'

/** Thrown when the provider is undefined. */
export class Provider_IsUndefinedError extends BaseError {
  override readonly name = 'Provider.IsUndefinedError'

  constructor() {
    super('`provider` is undefined.')
  }
}
