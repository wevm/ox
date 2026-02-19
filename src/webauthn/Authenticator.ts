import * as Base64 from '../core/Base64.js'
import * as Bytes from '../core/Bytes.js'
import * as Cbor from '../core/Cbor.js'
import * as CoseKey from '../core/CoseKey.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type * as PublicKey from '../core/PublicKey.js'
import type * as Types from './Types.js'

/**
 * Gets the authenticator data which contains information about the
 * processing of an authenticator request (ie. from `Authentication.sign`).
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * autenticator data. In most cases you will not need this function.
 * `authenticatorData` is typically returned as part of the
 * authenticator response.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Authenticator } from 'ox/webauthn'
 *
 * const authenticatorData = Authenticator.getAuthenticatorData({
 *   rpId: 'example.com',
 *   signCount: 420,
 * })
 * // @log: "0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194705000001a4"
 * ```
 *
 * @example
 * ### With Attested Credential Data
 *
 * Include a credential ID and public key in the authenticator data (for registration responses):
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { Authenticator } from 'ox/webauthn'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const authenticatorData = Authenticator.getAuthenticatorData({
 *   rpId: 'example.com',
 *   flag: 0x41, // UP + AT
 *   credential: {
 *     id: new Uint8Array(32),
 *     publicKey,
 *   },
 * })
 * ```
 *
 * @param options - Options to construct the authenticator data.
 * @returns The authenticator data.
 */
export function getAuthenticatorData(
  options: getAuthenticatorData.Options = {},
): Hex.Hex {
  const {
    credential,
    flag = 5,
    rpId = window.location.hostname,
    signCount = 0,
  } = options
  const rpIdHash = Hash.sha256(Hex.fromString(rpId))
  const flag_bytes = Hex.fromNumber(flag, { size: 1 })
  const signCount_bytes = Hex.fromNumber(signCount, { size: 4 })
  const base = Hex.concat(rpIdHash, flag_bytes, signCount_bytes)

  if (!credential) return base

  // AAGUID (16 bytes of zeros)
  const aaguid = Hex.fromBytes(new Uint8Array(16))

  // Credential ID
  const credentialId = Hex.fromBytes(credential.id)
  const credIdLen = Hex.fromNumber(credential.id.length, { size: 2 })

  // COSE public key
  const coseKey = CoseKey.fromPublicKey(credential.publicKey)

  return Hex.concat(base, aaguid, credIdLen, credentialId, coseKey)
}

export declare namespace getAuthenticatorData {
  type Options = {
    /** Attested credential data to include (credential ID + public key). When set, the AT flag (0x40) should also be set. */
    credential?:
      | {
          /** The credential ID as raw bytes. */
          id: Uint8Array
          /** The P256 public key associated with the credential. */
          publicKey: PublicKey.PublicKey
        }
      | undefined
    /** A bitfield that indicates various attributes that were asserted by the authenticator. [Read more](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/Authenticator_data#flags) */
    flag?: number | undefined
    /** The [Relying Party ID](https://w3c.github.io/webauthn/#relying-party-identifier) that the credential is scoped to. */
    rpId?: Types.PublicKeyCredentialRequestOptions['rpId'] | undefined
    /** A signature counter, if supported by the authenticator (set to 0 otherwise). */
    signCount?: number | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Extracts the signature counter from the authenticator data.
 * The counter is a 4-byte big-endian unsigned integer at bytes 33–36.
 *
 * Useful for detecting cloned authenticators: if the counter is non-zero and
 * does not monotonically increase between assertions, it may indicate a cloned key.
 *
 * @example
 * ```ts twoslash
 * import { Authenticator } from 'ox/webauthn'
 *
 * const signCount = Authenticator.getSignCount(
 *   '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
 * )
 * // @log: 1
 * ```
 *
 * @param authenticatorData - The authenticator data hex string.
 * @returns The signature counter.
 */
export function getSignCount(authenticatorData: Hex.Hex): number {
  const bytes = Bytes.fromHex(authenticatorData)
  if (bytes.length < 37) return 0
  return (
    ((bytes[33]! << 24) |
      (bytes[34]! << 16) |
      (bytes[35]! << 8) |
      bytes[36]!) >>>
    0
  )
}

export declare namespace getSignCount {
  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Constructs the Client Data in stringified JSON format which represents client data that
 * was passed to `credentials.get()` or `credentials.create()`.
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * client data. In most cases you will not need this function.
 * `clientDataJSON` is typically returned as part of the authenticator response.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Authenticator } from 'ox/webauthn'
 *
 * const clientDataJSON = Authenticator.getClientDataJSON({
 *   challenge: '0xdeadbeef',
 *   origin: 'https://example.com',
 * })
 * // @log: "{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":false}"
 * ```
 *
 * @param options - Options to construct the client data.
 * @returns The client data.
 */
export function getClientDataJSON(options: getClientDataJSON.Options): string {
  const {
    challenge,
    crossOrigin = false,
    extraClientData,
    origin = window.location.origin,
    type = 'webauthn.get',
  } = options

  return JSON.stringify({
    type,
    challenge: Base64.fromHex(challenge, { url: true, pad: false }),
    origin,
    crossOrigin,
    ...extraClientData,
  })
}

export declare namespace getClientDataJSON {
  type Options = {
    /** The challenge to sign. */
    challenge: Hex.Hex
    /** If set to `true`, it means that the calling context is an `<iframe>` that is not same origin with its ancestor frames. */
    crossOrigin?: boolean | undefined
    /** Additional client data to include in the client data JSON. */
    extraClientData?: Record<string, unknown> | undefined
    /** The fully qualified origin of the relying party which has been given by the client/browser to the authenticator. */
    origin?: string | undefined
    /** The WebAuthn ceremony type. @default 'webauthn.get' */
    type?: 'webauthn.create' | 'webauthn.get' | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Constructs a CBOR-encoded attestation object for testing WebAuthn registration
 * verification. Combines the authenticator data with an attestation statement.
 *
 * :::warning
 *
 * This function is mainly for testing purposes. In production, the attestation
 * object is returned by the authenticator during `navigator.credentials.create()`.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { Authenticator } from 'ox/webauthn'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const attestationObject = Authenticator.getAttestationObject({
 *   authData: Authenticator.getAuthenticatorData({
 *     rpId: 'example.com',
 *     flag: 0x41,
 *     credential: { id: new Uint8Array(32), publicKey },
 *   }),
 * })
 * ```
 *
 * @param options - Options to construct the attestation object.
 * @returns The CBOR-encoded attestation object as a Hex string.
 */
export function getAttestationObject(
  options: getAttestationObject.Options,
): Hex.Hex {
  const { attStmt = {}, authData, fmt = 'none' } = options
  return Cbor.encode({
    fmt,
    attStmt,
    authData: Hex.toBytes(authData),
  })
}

export declare namespace getAttestationObject {
  type Options = {
    /** Attestation statement. */
    attStmt?: Record<string, unknown> | undefined
    /** Authenticator data as a Hex string (from `Authenticator.getAuthenticatorData`). */
    authData: Hex.Hex
    /** Attestation format. @default 'none' */
    fmt?: string | undefined
  }

  type ErrorType = Cbor.encode.ErrorType | Errors.GlobalErrorType
}
