import type * as Errors from '../../Errors.js'
import { Base64_toBytes } from '../Base64/toBytes.js'
import { Bytes_fromString } from '../Bytes/fromString.js'
import { keccak256 } from '../Hash/keccak256.js'
import type { OneOf } from '../types.js'
import type {
  CredentialCreationOptions,
  PublicKeyCredentialCreationOptions,
} from './types.js'

export const WebAuthnP256_createChallenge = Uint8Array.from([
  105, 171, 180, 181, 160, 222, 75, 198, 42, 42, 32, 31, 141, 37, 186, 233,
])

/**
 * Returns the creation options for a P256 WebAuthn Credential to be used with
 * the Web Authentication API.
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const options = WebAuthnP256.getCredentialCreationOptions({ name: 'Example' })
 *
 * const credential = await window.navigator.credentials.create(options)
 * ```
 *
 * @param options - Options.
 * @returns The credential creation options.
 */
export function WebAuthnP256_getCredentialCreationOptions(
  options: WebAuthnP256_getCredentialCreationOptions.Options,
): CredentialCreationOptions {
  const {
    attestation = 'none',
    authenticatorSelection = {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      requireResidentKey: false,
      userVerification: 'required',
    },
    challenge = WebAuthnP256_createChallenge,
    excludeCredentialIds,
    name: name_,
    rp = {
      id: window.location.hostname,
      name: window.document.title,
    },
    user,
    extensions,
  } = options
  const name = (user?.name ?? name_)!
  return {
    publicKey: {
      attestation,
      authenticatorSelection,
      challenge,
      ...(excludeCredentialIds
        ? {
            excludeCredentials: excludeCredentialIds?.map((id) => ({
              id: Base64_toBytes(id),
              type: 'public-key',
            })),
          }
        : {}),
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // p256
        },
      ],
      rp,
      user: {
        id: user?.id ?? keccak256(Bytes_fromString(name), { as: 'Bytes' }),
        name,
        displayName: user?.displayName ?? name,
      },
      extensions,
    },
  } as CredentialCreationOptions
}

export declare namespace WebAuthnP256_getCredentialCreationOptions {
  type Options = {
    /**
     * A string specifying the relying party's preference for how the attestation statement
     * (i.e., provision of verifiable evidence of the authenticity of the authenticator and its data)
     * is conveyed during credential creation.
     */
    attestation?: PublicKeyCredentialCreationOptions['attestation'] | undefined
    /**
     * An object whose properties are criteria used to filter out the potential authenticators
     * for the credential creation operation.
     */
    authenticatorSelection?:
      | PublicKeyCredentialCreationOptions['authenticatorSelection']
      | undefined
    /**
     * An `ArrayBuffer`, `TypedArray`, or `DataView` used as a cryptographic challenge.
     */
    challenge?: PublicKeyCredentialCreationOptions['challenge'] | undefined
    /**
     * List of credential IDs to exclude from the creation. This property can be used
     * to prevent creation of a credential if it already exists.
     */
    excludeCredentialIds?: readonly string[] | undefined
    /**
     * List of Web Authentication API credentials to use during creation or authentication.
     */
    extensions?: PublicKeyCredentialCreationOptions['extensions'] | undefined
    /**
     * An object describing the relying party that requested the credential creation
     */
    rp?:
      | {
          id: string
          name: string
        }
      | undefined
    /**
     * A numerical hint, in milliseconds, which indicates the time the calling web app is willing to wait for the creation operation to complete.
     */
    timeout?: PublicKeyCredentialCreationOptions['timeout'] | undefined
  } & OneOf<
    | {
        /** Name for the credential (user.name). */
        name: string
      }
    | {
        /**
         * An object describing the user account for which the credential is generated.
         */
        user: {
          displayName?: string
          id?: BufferSource
          name: string
        }
      }
  >

  type ErrorType =
    | Base64_toBytes.ErrorType
    | keccak256.ErrorType
    | Bytes_fromString.ErrorType
    | Errors.GlobalErrorType
}

WebAuthnP256_getCredentialCreationOptions.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebAuthnP256_getCredentialCreationOptions.ErrorType
