import * as Base64 from '../core/Base64.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { OneOf } from '../core/internal/types.js'
import * as internal from '../core/internal/webauthn.js'
import * as P256 from '../core/P256.js'
import type * as PublicKey from '../core/PublicKey.js'
import * as Signature from '../core/Signature.js'
import { getAuthenticatorData, getClientDataJSON } from './Authenticator.js'
import type * as Credential_ from './Credential.js'
import {
  base64UrlOptions,
  bufferSourceToBytes,
  bytesToArrayBuffer,
  deserializeExtensions,
  responseKeys,
  serializeExtensions,
} from './internal/utils.js'
import type * as Types from './Types.js'

/** Response from a WebAuthn authentication ceremony. */
export type Response<serialized extends boolean = false> = {
  id: string
  metadata: Credential_.SignMetadata
  raw: Types.PublicKeyCredential<serialized>
  signature: serialized extends true ? Hex.Hex : Signature.Signature<false>
}

/**
 * Deserializes credential request options that can be passed to
 * `navigator.credentials.get()`.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const options = Authentication.getOptions({
 *   challenge: '0xdeadbeef',
 * })
 * const serialized = Authentication.serializeOptions(options)
 *
 * // ... send to server and back ...
 *
 * const deserialized = Authentication.deserializeOptions(serialized) // [!code focus]
 * const credential = await window.navigator.credentials.get(deserialized)
 * ```
 *
 * @param options - The serialized credential request options.
 * @returns The deserialized credential request options.
 */
export function deserializeOptions(
  options: Types.CredentialRequestOptions<true>,
): Types.CredentialRequestOptions {
  const { publicKey, ...rest } = options
  if (!publicKey) return { ...rest }

  const { allowCredentials, challenge, extensions, ...publicKeyRest } =
    publicKey

  return {
    ...rest,
    publicKey: {
      ...publicKeyRest,
      challenge: Bytes.fromHex(challenge),
      ...(allowCredentials && {
        allowCredentials: allowCredentials.map(({ id, ...rest }) => ({
          ...rest,
          id: Base64.toBytes(id),
        })),
      }),
      ...(extensions && {
        extensions: deserializeExtensions(extensions),
      }),
    },
  }
}

export declare namespace deserializeOptions {
  type ErrorType = Base64.toBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Deserializes a serialized authentication response.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const response = Authentication.deserializeResponse({ // [!code focus]
 *   metadata: { // [!code focus]
 *     authenticatorData: '0x49960de5...', // [!code focus]
 *     clientDataJSON: '{"type":"webauthn.get",...}', // [!code focus]
 *     challengeIndex: 23, // [!code focus]
 *     typeIndex: 1, // [!code focus]
 *     userVerificationRequired: true, // [!code focus]
 *   }, // [!code focus]
 *   raw: { // [!code focus]
 *     id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     type: 'public-key', // [!code focus]
 *     authenticatorAttachment: 'platform', // [!code focus]
 *     rawId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     response: {}, // [!code focus]
 *   }, // [!code focus]
 *   signature: '0x...', // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param response - The serialized authentication response.
 * @returns The deserialized authentication response.
 */
export function deserializeResponse(response: Response<true>): Response {
  const { id, metadata, raw, signature } = response

  const rawResponse: Record<string, ArrayBuffer> = {}
  for (const [key, value] of Object.entries(raw.response))
    rawResponse[key] = bytesToArrayBuffer(Base64.toBytes(value))

  return {
    id,
    metadata,
    raw: {
      id: raw.id,
      type: raw.type,
      authenticatorAttachment: raw.authenticatorAttachment,
      rawId: bytesToArrayBuffer(Base64.toBytes(raw.rawId)),
      response: rawResponse as unknown as Types.AuthenticatorResponse,
      getClientExtensionResults: () => ({}),
    },
    signature: Signature.from(signature),
  }
}

export declare namespace deserializeResponse {
  type ErrorType =
    | Base64.toBytes.ErrorType
    | Signature.from.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns the request options to sign a challenge with the Web Authentication API.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const options = Authentication.getOptions({
 *   challenge: '0xdeadbeef',
 * })
 *
 * const credential = await window.navigator.credentials.get(options)
 * ```
 *
 * @param options - Options.
 * @returns The credential request options.
 */
export function getOptions(
  options: getOptions.Options,
): Types.CredentialRequestOptions {
  const {
    credentialId,
    challenge,
    extensions,
    rpId = window.location.hostname,
    userVerification = 'required',
  } = options
  return {
    publicKey: {
      ...(credentialId
        ? {
            allowCredentials: Array.isArray(credentialId)
              ? credentialId.map((id) => ({
                  id: Base64.toBytes(id),
                  type: 'public-key',
                }))
              : [
                  {
                    id: Base64.toBytes(credentialId),
                    type: 'public-key',
                  },
                ],
          }
        : {}),
      challenge: Bytes.fromHex(challenge),
      ...(extensions && { extensions }),
      rpId,
      userVerification,
    },
  }
}

export declare namespace getOptions {
  type Options = {
    /** The credential ID to use. */
    credentialId?: string | string[] | undefined
    /** The challenge to sign. */
    challenge: Hex.Hex
    /** List of Web Authentication API credentials to use during creation or authentication. */
    extensions?:
      | Types.PublicKeyCredentialRequestOptions['extensions']
      | undefined
    /** The relying party identifier to use. */
    rpId?: Types.PublicKeyCredentialRequestOptions['rpId'] | undefined
    /** The user verification requirement. */
    userVerification?:
      | Types.PublicKeyCredentialRequestOptions['userVerification']
      | undefined
  }

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Base64.toBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Constructs the final digest that was signed and computed by the authenticator. This payload includes
 * the cryptographic `challenge`, as well as authenticator metadata (`authenticatorData` + `clientDataJSON`).
 * This value can be also used with raw P256 verification (such as `P256.verify` or
 * `WebCryptoP256.verify`).
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * signing payloads. In most cases you will not need this function and
 * instead use `Authentication.sign`.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 * import { WebCryptoP256 } from 'ox'
 *
 * const { metadata, payload } = Authentication.getSignPayload({ // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 * }) // [!code focus]
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
export function getSignPayload(
  options: getSignPayload.Options,
): getSignPayload.ReturnType {
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

  const authenticatorData = getAuthenticatorData({
    flag,
    rpId,
    signCount,
  })
  const clientDataJSON = getClientDataJSON({
    challenge,
    crossOrigin,
    extraClientData,
    origin,
  })
  const clientDataJSONHash = Hash.sha256(Hex.fromString(clientDataJSON))

  const challengeIndex = clientDataJSON.indexOf('"challenge"')
  const typeIndex = clientDataJSON.indexOf('"type"')

  const metadata = {
    authenticatorData,
    clientDataJSON,
    challengeIndex,
    typeIndex,
    userVerificationRequired: userVerification === 'required',
  }

  const payload = Hex.concat(authenticatorData, clientDataJSONHash)

  return { metadata, payload }
}

export declare namespace getSignPayload {
  type Options = {
    /** The challenge to sign. */
    challenge: Hex.Hex
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
    rpId?: Types.PublicKeyCredentialRequestOptions['rpId'] | undefined
    /** A signature counter, if supported by the authenticator (set to 0 otherwise). */
    signCount?: number | undefined
    /** The user verification requirement that the authenticator will enforce. */
    userVerification?:
      | Types.PublicKeyCredentialRequestOptions['userVerification']
      | undefined
  }

  type ReturnType = {
    metadata: Credential_.SignMetadata
    payload: Hex.Hex
  }

  type ErrorType =
    | Hash.sha256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes credential request options into a JSON-serializable
 * format, converting `BufferSource` fields to base64url strings.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const options = Authentication.getOptions({
 *   challenge: '0xdeadbeef',
 * })
 *
 * const serialized = Authentication.serializeOptions(options) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param options - The credential request options to serialize.
 * @returns The serialized credential request options.
 */
export function serializeOptions(
  options: Types.CredentialRequestOptions,
): Types.CredentialRequestOptions<true> {
  const { publicKey, signal: _, ...rest } = options
  if (!publicKey) return { ...rest }

  const { allowCredentials, challenge, extensions, ...publicKeyRest } =
    publicKey

  return {
    ...rest,
    publicKey: {
      ...publicKeyRest,
      challenge: Hex.fromBytes(bufferSourceToBytes(challenge)),
      ...(allowCredentials && {
        allowCredentials: allowCredentials.map(({ id, ...rest }) => ({
          ...rest,
          id: Base64.fromBytes(bufferSourceToBytes(id), base64UrlOptions),
        })),
      }),
      ...(extensions && {
        extensions: serializeExtensions(extensions),
      }),
    },
  }
}

export declare namespace serializeOptions {
  type ErrorType = Base64.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Serializes an authentication response into a JSON-serializable
 * format, converting `BufferSource` fields to base64url strings
 * and the signature to a hex string.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const response = await Authentication.sign({
 *   challenge: '0xdeadbeef',
 * })
 *
 * const serialized = Authentication.serializeResponse(response) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param response - The authentication response to serialize.
 * @returns The serialized authentication response.
 */
export function serializeResponse(response: Response): Response<true> {
  const { id, metadata, raw, signature } = response

  const rawResponse = {} as Record<string, string>
  for (const key of responseKeys) {
    const value = (raw.response as unknown as Record<string, unknown>)[key]
    if (value instanceof ArrayBuffer)
      rawResponse[key] = Base64.fromBytes(
        new Uint8Array(value),
        base64UrlOptions,
      )
  }

  return {
    id,
    metadata,
    raw: {
      id: raw.id,
      type: raw.type,
      authenticatorAttachment: raw.authenticatorAttachment,
      rawId: Base64.fromBytes(bufferSourceToBytes(raw.rawId), base64UrlOptions),
      response: rawResponse as unknown as Types.AuthenticatorResponse<true>,
    },
    signature: Signature.toHex(signature),
  }
}

export declare namespace serializeResponse {
  type ErrorType =
    | Base64.fromBytes.ErrorType
    | Signature.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Signs a challenge using a stored WebAuthn P256 Credential. If no Credential is provided,
 * a prompt will be displayed for the user to select an existing Credential
 * that was previously registered.
 *
 * @example
 * ```ts twoslash
 * import { Registration, Authentication } from 'ox/webauthn'
 *
 * const credential = await Registration.create({
 *   name: 'Example',
 * })
 *
 * const { metadata, signature } = await Authentication.sign({ // [!code focus]
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
export async function sign(options: sign.Options): Promise<sign.ReturnType> {
  const {
    getFn = window.navigator.credentials.get.bind(window.navigator.credentials),
    ...rest
  } = options
  const requestOptions =
    'publicKey' in rest
      ? (rest as Types.CredentialRequestOptions)
      : getOptions(rest as never)
  try {
    const credential = (await getFn(
      requestOptions as never,
    )) as Types.PublicKeyCredential
    if (!credential) throw new SignFailedError()
    const response = credential.response as AuthenticatorAssertionResponse

    const clientDataJSON = String.fromCharCode(
      ...new Uint8Array(response.clientDataJSON),
    )
    const challengeIndex = clientDataJSON.indexOf('"challenge"')
    const typeIndex = clientDataJSON.indexOf('"type"')

    const signature = internal.parseAsn1Signature(
      new Uint8Array(response.signature),
    )

    return {
      id: credential.id,
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
    throw new SignFailedError({
      cause: error as Error,
    })
  }
}

export declare namespace sign {
  type Options = OneOf<
    | (getOptions.Options & {
        /**
         * Credential request function. Useful for environments that do not support
         * the WebAuthn API natively (i.e. React Native or testing environments).
         *
         * @default window.navigator.credentials.get
         */
        getFn?:
          | ((
              options?: Types.CredentialRequestOptions | undefined,
            ) => Promise<Types.Credential | null>)
          | undefined
      })
    | Types.CredentialRequestOptions
  >

  type ReturnType = Response

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | getOptions.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when a WebAuthn P256 credential request fails. */
export class SignFailedError extends Errors.BaseError<Error> {
  override readonly name = 'Authentication.SignFailedError'

  constructor({ cause }: { cause?: Error | undefined } = {}) {
    super('Failed to request credential.', {
      cause,
    })
  }
}

/**
 * Verifies a signature using the Credential's public key and the challenge which was signed.
 *
 * @example
 * ```ts twoslash
 * import { Registration, Authentication } from 'ox/webauthn'
 *
 * const credential = await Registration.create({
 *   name: 'Example',
 * })
 *
 * const { metadata, signature } = await Authentication.sign({
 *   credentialId: credential.id,
 *   challenge: '0xdeadbeef',
 * })
 *
 * const result = Authentication.verify({ // [!code focus]
 *   metadata, // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 *   publicKey: credential.publicKey, // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: true
 * ```
 *
 * @param options - Options.
 * @returns Whether the signature is valid.
 */
export function verify(options: verify.Options): boolean {
  const { challenge, metadata, origin, publicKey, rpId, signature } = options
  const { authenticatorData, clientDataJSON, userVerificationRequired } =
    metadata

  const authenticatorDataBytes = Bytes.fromHex(authenticatorData)

  // Check length of `authenticatorData`.
  if (authenticatorDataBytes.length < 37) return false

  // If rpId is provided, validate the rpIdHash in authenticatorData.
  if (rpId !== undefined) {
    const rpIdHash = authenticatorDataBytes.slice(0, 32)
    const expectedRpIdHash = Hash.sha256(Hex.fromString(rpId), { as: 'Bytes' })
    if (!Bytes.isEqual(rpIdHash, expectedRpIdHash)) return false
  }

  const flag = authenticatorDataBytes[32]!

  // Verify that the UP bit of the flags in authData is set.
  if ((flag & 0x01) !== 0x01) return false

  // If user verification was determined to be required, verify that
  // the UV bit of the flags in authData is set. Otherwise, ignore the
  // value of the UV flag.
  if (userVerificationRequired && (flag & 0x04) !== 0x04) return false

  // If the BE bit of the flags in authData is not set, verify that
  // the BS bit is not set.
  if ((flag & 0x08) !== 0x08 && (flag & 0x10) === 0x10) return false

  // Parse clientDataJSON for validation.
  const clientData = JSON.parse(clientDataJSON)

  // Verify that response is for an authentication assertion.
  if (clientData.type !== 'webauthn.get') return false

  // Validate the challenge in the clientDataJSON.
  if (
    !clientData.challenge ||
    Hex.fromBytes(Base64.toBytes(clientData.challenge)) !== challenge
  )
    return false

  // If origin is provided, validate origin.
  if (origin !== undefined) {
    const origins = Array.isArray(origin) ? origin : [origin]
    if (!origins.includes(clientData.origin)) return false
  }

  const clientDataJSONHash = Hash.sha256(Bytes.fromString(clientDataJSON), {
    as: 'Bytes',
  })
  const payload = Bytes.concat(authenticatorDataBytes, clientDataJSONHash)

  return P256.verify({
    hash: true,
    payload,
    publicKey,
    signature,
  })
}

export declare namespace verify {
  type Options = {
    /** The challenge to verify. */
    challenge: Hex.Hex
    /** The public key to verify the signature with. */
    publicKey: PublicKey.PublicKey
    /** The signature to verify. */
    signature: Signature.Signature<false>
    /** The metadata to verify the signature with. */
    metadata: Credential_.SignMetadata
    /** Expected origin(s). If provided, the `clientDataJSON` origin will be validated. */
    origin?: string | string[] | undefined
    /** Expected relying party ID. If provided, the `rpIdHash` in `authenticatorData` will be validated. */
    rpId?: string | undefined
  }

  type ErrorType =
    | Base64.toBytes.ErrorType
    | Bytes.concat.ErrorType
    | Bytes.fromHex.ErrorType
    | Bytes.isEqual.ErrorType
    | Hash.sha256.ErrorType
    | Hex.fromString.ErrorType
    | P256.verify.ErrorType
    | Errors.GlobalErrorType
}
