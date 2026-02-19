import * as Authentication from '../webauthn/Authentication.js'
import * as Authenticator from '../webauthn/Authenticator.js'
import type * as Credential_ from '../webauthn/Credential.js'
import * as Registration from '../webauthn/Registration.js'

/** A WebAuthn-flavored P256 credential. */
export type P256Credential = Credential_.Credential

/** Metadata for a WebAuthn P256 signature. */
export type SignMetadata = Credential_.SignMetadata

export const createChallenge = Registration.createChallenge

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
export async function createCredential(
  options: createCredential.Options,
): Promise<P256Credential> {
  return Registration.create(options)
}

export declare namespace createCredential {
  type Options = Registration.create.Options
  type ErrorType = Registration.create.ErrorType
}

/**
 * Gets the authenticator data which contains information about the
 * processing of an authenticator request (ie. from `WebAuthnP256.sign`).
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * autenticator data. In most cases you will not need this function.
 * `authenticatorData` is typically returned as part of the
 * {@link ox#WebAuthnP256.(sign:function)} response (ie. an authenticator response).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const authenticatorData = WebAuthnP256.getAuthenticatorData({
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
 * import { P256, WebAuthnP256 } from 'ox'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const authenticatorData = WebAuthnP256.getAuthenticatorData({
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
export const getAuthenticatorData = Authenticator.getAuthenticatorData

export declare namespace getAuthenticatorData {
  type Options = Authenticator.getAuthenticatorData.Options

  type ErrorType = Authenticator.getAuthenticatorData.ErrorType
}

/**
 * Constructs the Client Data in stringified JSON format which represents client data that
 * was passed to `credentials.get()` in {@link ox#WebAuthnP256.(sign:function)}.
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * client data. In most cases you will not need this function.
 * `clientDataJSON` is typically returned as part of the
 * {@link ox#WebAuthnP256.(sign:function)} response (ie. an authenticator response).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const clientDataJSON = WebAuthnP256.getClientDataJSON({
 *   challenge: '0xdeadbeef',
 *   origin: 'https://example.com',
 * })
 * // @log: "{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":false}"
 * ```
 *
 * @param options - Options to construct the client data.
 * @returns The client data.
 */
export const getClientDataJSON = Authenticator.getClientDataJSON

export declare namespace getClientDataJSON {
  type Options = Authenticator.getClientDataJSON.Options

  type ErrorType = Authenticator.getClientDataJSON.ErrorType
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
 * import { P256, WebAuthnP256 } from 'ox'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const attestationObject = WebAuthnP256.getAttestationObject({
 *   authData: WebAuthnP256.getAuthenticatorData({
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
export const getAttestationObject = Authenticator.getAttestationObject

export declare namespace getAttestationObject {
  type Options = Authenticator.getAttestationObject.Options

  type ErrorType = Authenticator.getAttestationObject.ErrorType
}

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
export const getCredentialCreationOptions = Registration.getOptions

export declare namespace getCredentialCreationOptions {
  type Options = Registration.getOptions.Options

  type ErrorType = Registration.getOptions.ErrorType
}

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
export const getCredentialRequestOptions = Authentication.getOptions

export declare namespace getCredentialRequestOptions {
  type Options = Authentication.getOptions.Options
  type ErrorType = Authentication.getOptions.ErrorType
}

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
export const getSignPayload = Authentication.getSignPayload

export declare namespace getSignPayload {
  type Options = Authentication.getSignPayload.Options

  type ReturnType = Authentication.getSignPayload.ReturnType

  type ErrorType = Authentication.getSignPayload.ErrorType
}

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
export async function sign(options: sign.Options): Promise<sign.ReturnType> {
  return Authentication.sign(options)
}

export declare namespace sign {
  type Options = Authentication.sign.Options

  type ReturnType = Authentication.sign.ReturnType

  type ErrorType = Authentication.sign.ErrorType
}

/**
 * Verifies a signature using the Credential's public key and the challenge which was signed.
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const credential = await WebAuthnP256.createCredential({
 *   name: 'Example',
 * })
 *
 * const { metadata, signature } = await WebAuthnP256.sign({
 *   credentialId: credential.id,
 *   challenge: '0xdeadbeef',
 * })
 *
 * const result = await WebAuthnP256.verify({ // [!code focus]
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
  return Authentication.verify(options)
}

export declare namespace verify {
  type Options = Authentication.verify.Options

  type ErrorType = Authentication.verify.ErrorType
}

// Export types required for inference.
export type {
  AttestationConveyancePreference,
  AuthenticationExtensionsClientInputs,
  AuthenticatorAttachment,
  AuthenticatorSelectionCriteria,
  AuthenticatorTransport,
  BufferSource,
  COSEAlgorithmIdentifier,
  Credential,
  CredentialCreationOptions,
  CredentialMediationRequirement,
  CredentialRequestOptions,
  LargeBlobSupport,
  PrfExtension,
  PublicKeyCredential,
  PublicKeyCredentialCreationOptions,
  PublicKeyCredentialDescriptor,
  PublicKeyCredentialEntity,
  PublicKeyCredentialParameters,
  PublicKeyCredentialRequestOptions,
  PublicKeyCredentialRpEntity,
  PublicKeyCredentialType,
  PublicKeyCredentialUserEntity,
  ResidentKeyRequirement,
  UserVerificationRequirement,
} from '../webauthn/Types.js'
