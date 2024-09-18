export {
  WebAuthnP256_CredentialCreationFailedError as CredentialCreationFailedError,
  WebAuthnP256_CredentialRequestFailedError as CredentialRequestFailedError,
} from './internal/WebAuthnP256/errors.js'

export { WebAuthnP256_createCredential as createCredential } from './internal/WebAuthnP256/createCredential.js'

export { WebAuthnP256_getAuthenticatorData as getAuthenticatorData } from './internal/WebAuthnP256/getAuthenticatorData.js'

export { WebAuthnP256_getClientDataJSON as getClientDataJSON } from './internal/WebAuthnP256/getClientDataJSON.js'

export { WebAuthnP256_getCredentialCreationOptions as getCredentialCreationOptions } from './internal/WebAuthnP256/getCredentialCreationOptions.js'

export { WebAuthnP256_getCredentialRequestOptions as getCredentialRequestOptions } from './internal/WebAuthnP256/getCredentialRequestOptions.js'

export { WebAuthnP256_getSignPayload as getSignPayload } from './internal/WebAuthnP256/getSignPayload.js'

export { WebAuthnP256_sign as sign } from './internal/WebAuthnP256/sign.js'

export { WebAuthnP256_verify as verify } from './internal/WebAuthnP256/verify.js'

export type {
  WebAuthnP256_P256Credential as P256Credential,
  WebAuthnP256_SignMetadata as SignMetadata,
} from './internal/WebAuthnP256/types.js'
