import type { Bytes } from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as PublicKey from '../../PublicKey.js'
import { WebAuthnP256_CredentialCreationFailedError } from './errors.js'
import { WebAuthnP256_getCredentialCreationOptions } from './getCredentialCreationOptions.js'
import type {
  Credential,
  CredentialCreationOptions,
  PublicKeyCredential,
  WebAuthnP256_P256Credential,
} from './types.js'

/**
 * Creates a new WebAuthn P256 Credential, which can be stored and later used for signing.
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const credential = await WebAuthnP256.createCredential({ name: 'Example' }) // [!code focus]
 * // @log: {
 * // @log:   id: 'oZ48...',
 * // @log:   publicKey: { x: 51421...5123n, y: 12345...6789n },
 * // @log:   raw: PublicKeyCredential {},
 * // @log: }
 *
 * const { metadata, signature } = await WebAuthnP256.sign({
 *   credentialId: credential.id,
 *   challenge: '0xdeadbeef',
 * })
 * ```
 *
 * @param options - Credential creation options.
 * @returns A WebAuthn P256 credential.
 */
export async function WebAuthnP256_createCredential(
  options: WebAuthnP256_createCredential.Options,
): Promise<WebAuthnP256_P256Credential> {
  const {
    createFn = window.navigator.credentials.create.bind(
      window.navigator.credentials,
    ),
    ...rest
  } = options
  const creationOptions = WebAuthnP256_getCredentialCreationOptions(rest)
  try {
    const credential = (await createFn(creationOptions)) as PublicKeyCredential
    if (!credential) throw new WebAuthnP256_CredentialCreationFailedError()
    const publicKey = await parseCredentialPublicKey(
      new Uint8Array((credential.response as any).getPublicKey()),
    )
    return {
      id: credential.id,
      publicKey,
      raw: credential,
    }
  } catch (error) {
    throw new WebAuthnP256_CredentialCreationFailedError({
      cause: error as Error,
    })
  }
}

export declare namespace WebAuthnP256_createCredential {
  type Options = WebAuthnP256_getCredentialCreationOptions.Options & {
    /**
     * Credential creation function. Useful for environments that do not support
     * the WebAuthn API natively (i.e. React Native or testing environments).
     *
     * @default window.navigator.credentials.create
     */
    createFn?:
      | ((
          options?: CredentialCreationOptions | undefined,
        ) => Promise<Credential | null>)
      | undefined
  }

  type ErrorType =
    | WebAuthnP256_getCredentialCreationOptions.ErrorType
    | Errors.GlobalErrorType
}

WebAuthnP256_createCredential.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebAuthnP256_createCredential.ErrorType

/**
 * Parses a public key into x and y coordinates from the public key
 * defined on the credential.
 *
 * @internal
 */
export async function parseCredentialPublicKey(
  cPublicKey: Bytes,
): Promise<PublicKey.PublicKey> {
  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    new Uint8Array(cPublicKey),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
      hash: 'SHA-256',
    },
    true,
    ['verify'],
  )
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', cryptoKey),
  )
  return PublicKey.from(publicKey)
}
