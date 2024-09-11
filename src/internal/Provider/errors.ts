import { BaseError } from '../Errors/base.js'

export class Provider_IsUndefinedError extends BaseError {
  override readonly name = 'Provider.IsUndefinedError'

  constructor() {
    super('`provider` is undefined.', {
      docsPath: '/errors#providerisundefinederror',
    })
  }
}
