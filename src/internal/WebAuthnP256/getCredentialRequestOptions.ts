import type * as Errors from '../../Errors.js'
import { Base64_toBytes } from '../Base64/toBytes.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Hex } from '../Hex/types.js'
import type {
  CredentialRequestOptions,
  PublicKeyCredentialRequestOptions,
} from './types.js'

/**
 * Returns the request options to sign a challenge with the Web Authentication API.
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const options = WebAuthnP256.getCredentialRequestOptions({
 *   challenge: '0xdeadbeef',
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
    challenge,
    rpId = window.location.hostname,
    userVerification = 'required',
  } = options
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
      challenge: Bytes_fromHex(challenge),
      rpId,
      userVerification,
    },
  }
}

export declare namespace WebAuthnP256_getCredentialRequestOptions {
  type Options = {
    /** The credential ID to use. */
    credentialId?: string | undefined
    /** The challenge to sign. */
    challenge: Hex
    /** The relying party identifier to use. */
    rpId?: PublicKeyCredentialRequestOptions['rpId'] | undefined
    /** The user verification requirement. */
    userVerification?:
      | PublicKeyCredentialRequestOptions['userVerification']
      | undefined
  }

  type ErrorType =
    | Bytes_fromHex.ErrorType
    | Base64_toBytes.ErrorType
    | Errors.GlobalErrorType
}

WebAuthnP256_getCredentialRequestOptions.parseError = (error: unknown) =>
  error as WebAuthnP256_getCredentialRequestOptions.ErrorType
