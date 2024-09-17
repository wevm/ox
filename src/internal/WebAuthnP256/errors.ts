import { BaseError } from '../Errors/base.js'

export class WebAuthnP256_CredentialCreationFailedError extends BaseError<Error> {
  override readonly name = 'WebAuthnP256.CredentialCreationFailedError'

  constructor({ cause }: { cause?: Error | undefined } = {}) {
    super('Failed to create credential.', {
      cause,
    })
  }
}

export class WebAuthnP256_CredentialRequestFailedError extends BaseError<Error> {
  override readonly name = 'WebAuthnP256.CredentialRequestFailedError'

  constructor({ cause }: { cause?: Error | undefined } = {}) {
    super('Failed to request credential.', {
      cause,
    })
  }
}
