import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_sha256 } from '../Hash/sha256.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_fromString } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { WebAuthnP256_getAuthenticatorData } from './getAuthenticatorData.js'
import { WebAuthnP256_getClientDataJSON } from './getClientDataJSON.js'
import type {
  PublicKeyCredentialRequestOptions,
  WebAuthnP256_SignMetadata,
} from './types.js'

/**
 * Constructs the final digest that was signed and computed by the authenticator. This payload includes
 * the cryptographic `challenge`, as well as authenticator metadata (`authenticatorData` + `clientDataJSON`).
 * This value can be also used with raw P256 verification (such as {@link ox#P256.(verify:function)} or
 * {@link ox#WebCryptoP256.(verify:function)}).
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * signing payloads. In most cases you will not need this function and
 * instead use {@link ox#WebAuthnP256.(sign:function)}.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256, WebCryptoP256 } from 'ox'
 *
 * const { metadata, payload } = WebAuthnP256.getSignPayload({ // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   metadata: {
 * // @log:     authenticatorData: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
 * // @log:     challengeIndex: 23,
 * // @log:     clientDataJSON: "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}",
 * // @log:     typeIndex: 1,
 * // @log:     userVerificationRequired: true,
 * // @log:   },
 * // @log:   payload: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763050000000045086dcb06a5f234db625bcdc94e657f86b76b6fd3eb9c30543eabc1e577a4b0",
 * // @log: }
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPair()
 *
 * const signature = await WebCryptoP256.sign({
 *   payload,
 *   privateKey,
 * })
 * ```
 *
 * @param options - Options to construct the signing payload.
 * @returns The signing payload.
 */
export function WebAuthnP256_getSignPayload(
  options: WebAuthnP256_getSignPayload.Options,
): WebAuthnP256_getSignPayload.ReturnType {
  const {
    challenge,
    crossOrigin,
    extraClientData,
    flag,
    origin,
    rpId,
    signCount,
    userVerification = 'required',
  } = options

  const authenticatorData = WebAuthnP256_getAuthenticatorData({
    flag,
    rpId,
    signCount,
  })
  const clientDataJSON = WebAuthnP256_getClientDataJSON({
    challenge,
    crossOrigin,
    extraClientData,
    origin,
  })
  const clientDataJSONHash = Hash_sha256(Hex_fromString(clientDataJSON))

  const challengeIndex = clientDataJSON.indexOf('"challenge"')
  const typeIndex = clientDataJSON.indexOf('"type"')

  const metadata = {
    authenticatorData,
    clientDataJSON,
    challengeIndex,
    typeIndex,
    userVerificationRequired: userVerification === 'required',
  }

  const payload = Hex_concat(authenticatorData, clientDataJSONHash)

  return { metadata, payload }
}

export declare namespace WebAuthnP256_getSignPayload {
  type Options = {
    /** The challenge to sign. */
    challenge: Hex
    /** If set to `true`, it means that the calling context is an `<iframe>` that is not same origin with its ancestor frames. */
    crossOrigin?: boolean | undefined
    /** Additional client data to include in the client data JSON. */
    extraClientData?: Record<string, unknown> | undefined
    /** If set to `true`, the payload will be hashed before being returned. */
    hash?: boolean | undefined
    /** A bitfield that indicates various attributes that were asserted by the authenticator. [Read more](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/Authenticator_data#flags) */
    flag?: number | undefined
    /** The fully qualified origin of the relying party which has been given by the client/browser to the authenticator. */
    origin?: string | undefined
    /** The [Relying Party ID](https://w3c.github.io/webauthn/#relying-party-identifier) that the credential is scoped to. */
    rpId?: PublicKeyCredentialRequestOptions['rpId'] | undefined
    /** A signature counter, if supported by the authenticator (set to 0 otherwise). */
    signCount?: number | undefined
    /** The user verification requirement that the authenticator will enforce. */
    userVerification?:
      | PublicKeyCredentialRequestOptions['userVerification']
      | undefined
  }

  type ReturnType = {
    metadata: WebAuthnP256_SignMetadata
    payload: Hex
  }

  type ErrorType =
    | Hash_sha256.ErrorType
    | Hex_concat.ErrorType
    | Hex_fromString.ErrorType
    | WebAuthnP256_getAuthenticatorData.ErrorType
    | WebAuthnP256_getClientDataJSON.ErrorType
    | GlobalErrorType
}

WebAuthnP256_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebAuthnP256_getSignPayload.ErrorType
