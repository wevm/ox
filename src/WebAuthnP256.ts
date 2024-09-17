export {
  WebAuthnP256_CredentialCreationFailedError as CredentialCreationFailedError,
  WebAuthnP256_CredentialRequestFailedError as CredentialRequestFailedError,
} from './internal/WebAuthnP256/errors.js'

export { WebAuthnP256_createCredential as createCredential } from './internal/WebAuthnP256/createCredential.js'

export { WebAuthnP256_getCredentialCreationOptions as getCredentialCreationOptions } from './internal/WebAuthnP256/getCredentialCreationOptions.js'

export { WebAuthnP256_getCredentialRequestOptions as getCredentialRequestOptions } from './internal/WebAuthnP256/getCredentialRequestOptions.js'

export { WebAuthnP256_sign as sign } from './internal/WebAuthnP256/sign.js'

export { WebAuthnP256_verify as verify } from './internal/WebAuthnP256/verify.js'

export type { P256Credential } from './internal/WebAuthnP256/types.js'
