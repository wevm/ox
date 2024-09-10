import { BaseError } from '../Errors/base.js'

export class Siwe_InvalidMessageFieldError extends BaseError {
  override readonly name = 'Siwe.InvalidMessageFieldError'

  constructor(parameters: {
    field: string
    metaMessages?: string[] | undefined
  }) {
    const { field, metaMessages } = parameters
    super(`Invalid Sign-In with Ethereum message field "${field}".`, {
      docsPath: '/errors#siweinvalidmessagefielderror',
      metaMessages,
    })
  }
}
