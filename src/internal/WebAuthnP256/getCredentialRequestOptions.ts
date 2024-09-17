import { Base64_toBytes } from '../Base64/to.js'
import { Bytes_from } from '../Bytes/from.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type {
  CredentialRequestOptions,
  PublicKeyCredentialRequestOptions,
} from './types.js'

/**
 * Returns the request options to sign a payload with the Web Authentication API.
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const options = WebAuthnP256.getCredentialRequestOptions({
 *   payload: '0xdeadbeef',
 * })
 *
 * const credential = await window.navigator.credentials.get(options)
 * ```
 *
 * @param options - Options.
 * @returns The credential request options.
 */
export function WebAuthnP256_getCredentialRequestOptions(
  options: WebAuthnP256_getCredentialRequestOptions.Options,
): CredentialRequestOptions {
  const {
    credentialId,
    payload,
    rpId = window.location.hostname,
    userVerification = 'required',
  } = options
  const challenge = Bytes_from(payload)
  return {
    publicKey: {
      ...(credentialId
        ? {
            allowCredentials: [
              {
                id: Base64_toBytes(credentialId),
                type: 'public-key',
              },
            ],
          }
        : {}),
      challenge,
      rpId,
      userVerification,
    },
  }
}

export declare namespace WebAuthnP256_getCredentialRequestOptions {
  type Options = {
    credentialId?: string | undefined
    payload: Hex
    /**
     * The relying party identifier to use.
     */
    rpId?: PublicKeyCredentialRequestOptions['rpId'] | undefined
    userVerification?:
      | PublicKeyCredentialRequestOptions['userVerification']
      | undefined
  }

  type ErrorType =
    | Bytes_from.ErrorType
    | Base64_toBytes.ErrorType
    | GlobalErrorType
}

WebAuthnP256_getCredentialRequestOptions.parseError = (error: unknown) =>
  error as WebAuthnP256_getCredentialRequestOptions.ErrorType
