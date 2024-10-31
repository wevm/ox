import { p256 } from '@noble/curves/p256'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type * as Signature from '../../Signature.js'
import { WebAuthnP256_CredentialRequestFailedError } from './errors.js'
import { WebAuthnP256_getCredentialRequestOptions } from './getCredentialRequestOptions.js'
import type {
  Credential,
  CredentialRequestOptions,
  WebAuthnP256_SignMetadata,
} from './types.js'

/**
 * Signs a challenge using a stored WebAuthn P256 Credential. If no Credential is provided,
 * a prompt will be displayed for the user to select an existing Credential
 * that was previously registered.
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const credential = await WebAuthnP256.createCredential({
 *   name: 'Example',
 * })
 *
 * const { metadata, signature } = await WebAuthnP256.sign({ // [!code focus]
 *   credentialId: credential.id, // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   metadata: {
 * // @log:     authenticatorData: '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
 * // @log:     clientDataJSON: '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
 * // @log:     challengeIndex: 23,
 * // @log:     typeIndex: 1,
 * // @log:     userVerificationRequired: true,
 * // @log:   },
 * // @log:   signature: { r: 51231...4215n, s: 12345...6789n },
 * // @log: }
 * ```
 *
 * @param options - Options.
 * @returns The signature.
 */
export async function WebAuthnP256_sign(
  options: WebAuthnP256_sign.Options,
): Promise<WebAuthnP256_sign.ReturnType> {
  const {
    getFn = window.navigator.credentials.get.bind(window.navigator.credentials),
    ...rest
  } = options
  const requestOptions = WebAuthnP256_getCredentialRequestOptions(rest)
  try {
    const credential = (await getFn(requestOptions)) as PublicKeyCredential
    if (!credential) throw new WebAuthnP256_CredentialRequestFailedError()
    const response = credential.response as AuthenticatorAssertionResponse

    const clientDataJSON = String.fromCharCode(
      ...new Uint8Array(response.clientDataJSON),
    )
    const challengeIndex = clientDataJSON.indexOf('"challenge"')
    const typeIndex = clientDataJSON.indexOf('"type"')

    const signature = parseAsn1Signature(new Uint8Array(response.signature))

    return {
      metadata: {
        authenticatorData: Hex.fromBytes(
          new Uint8Array(response.authenticatorData),
        ),
        clientDataJSON,
        challengeIndex,
        typeIndex,
        userVerificationRequired:
          requestOptions.publicKey!.userVerification === 'required',
      },
      signature,
      raw: credential,
    }
  } catch (error) {
    throw new WebAuthnP256_CredentialRequestFailedError({
      cause: error as Error,
    })
  }
}

export declare namespace WebAuthnP256_sign {
  type Options = WebAuthnP256_getCredentialRequestOptions.Options & {
    /**
     * Credential request function. Useful for environments that do not support
     * the WebAuthn API natively (i.e. React Native or testing environments).
     *
     * @default window.navigator.credentials.get
     */
    getFn?:
      | ((
          options?: CredentialRequestOptions | undefined,
        ) => Promise<Credential | null>)
      | undefined
  }

  type ReturnType = {
    metadata: WebAuthnP256_SignMetadata
    raw: PublicKeyCredential
    signature: Signature.Signature<false>
  }

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | WebAuthnP256_getCredentialRequestOptions.ErrorType
    | Errors.GlobalErrorType
}

WebAuthnP256_sign.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebAuthnP256_sign.ErrorType

/**
 * Parses an ASN.1 signature into a r and s value.
 *
 * @internal
 */
export function parseAsn1Signature(bytes: Uint8Array) {
  const r_start = bytes[4] === 0 ? 5 : 4
  const r_end = r_start + 32
  const s_start = bytes[r_end + 2] === 0 ? r_end + 3 : r_end + 2

  const r = BigInt(Hex.fromBytes(bytes.slice(r_start, r_end)))
  const s = BigInt(Hex.fromBytes(bytes.slice(s_start)))

  return {
    r,
    s: s > p256.CURVE.n / 2n ? p256.CURVE.n - s : s,
  }
}
