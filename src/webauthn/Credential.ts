import * as Base64 from '../core/Base64.js'
import type * as Errors from '../core/Errors.js'
import type * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as PublicKey from '../core/PublicKey.js'
import {
  base64UrlOptions,
  bufferSourceToBytes,
  bytesToArrayBuffer,
  responseKeys,
} from './internal/utils.js'
import type * as Types from './Types.js'

/** A WebAuthn-flavored P256 credential. */
export type Credential<serialized extends boolean = false> = {
  attestationObject: serialized extends true ? string : ArrayBuffer
  clientDataJSON: serialized extends true ? string : ArrayBuffer
  id: string
  publicKey: serialized extends true ? Hex.Hex : PublicKey.PublicKey
  raw: Types.PublicKeyCredential<serialized>
}

/** Metadata for a WebAuthn P256 signature. */
export type SignMetadata = Compute<{
  authenticatorData: Hex.Hex
  challengeIndex?: number | undefined
  clientDataJSON: string
  typeIndex?: number | undefined
  userVerificationRequired?: boolean | undefined
}>

/**
 * Serializes a credential into a JSON-serializable
 * format.
 *
 * @example
 * ```ts twoslash
 * import { Registration, Credential } from 'ox/webauthn'
 *
 * const credential = await Registration.create({ name: 'Example' })
 *
 * const serialized = Credential.serialize(credential) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param credential - The credential to serialize.
 * @returns The serialized credential.
 */
export function serialize(credential: Credential): Credential<true> {
  const { attestationObject, clientDataJSON, id, publicKey, raw } = credential

  const response = {} as Record<string, string>
  for (const key of responseKeys) {
    const value = (raw.response as unknown as Record<string, unknown>)[key]
    if (value instanceof ArrayBuffer)
      response[key] = Base64.fromBytes(new Uint8Array(value), base64UrlOptions)
  }

  return {
    attestationObject: Base64.fromBytes(
      new Uint8Array(attestationObject),
      base64UrlOptions,
    ),
    clientDataJSON: Base64.fromBytes(
      new Uint8Array(clientDataJSON),
      base64UrlOptions,
    ),
    id,
    publicKey: PublicKey.toHex(publicKey),
    raw: {
      id: raw.id,
      type: raw.type,
      authenticatorAttachment: raw.authenticatorAttachment,
      rawId: Base64.fromBytes(bufferSourceToBytes(raw.rawId), base64UrlOptions),
      response: response as unknown as Types.AuthenticatorResponse<true>,
    },
  }
}

export declare namespace serialize {
  type ErrorType =
    | Base64.fromBytes.ErrorType
    | PublicKey.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Deserializes a serialized credential.
 *
 * @example
 * ```ts twoslash
 * import { Credential } from 'ox/webauthn'
 *
 * const credential = Credential.deserialize({ // [!code focus]
 *   attestationObject: 'o2NmbXRkbm9uZQ...', // [!code focus]
 *   clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0', // [!code focus]
 *   id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *   publicKey: '0x04ab891400140fc4f8e941ce0ff90e419de9470acaca613bbd717a4775435031a7d884318e919fd3b3e5a631d866d8a380b44063e70f0c381ee16e0652f7f97554', // [!code focus]
 *   raw: { // [!code focus]
 *     id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     type: 'public-key', // [!code focus]
 *     authenticatorAttachment: 'platform', // [!code focus]
 *     rawId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     response: { // [!code focus]
 *       clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0', // [!code focus]
 *     }, // [!code focus]
 *   }, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param credential - The serialized credential.
 * @returns The deserialized credential.
 */
export function deserialize(credential: Credential<true>): Credential {
  const { attestationObject, clientDataJSON, id, publicKey, raw } = credential

  const response = Object.create(null) as Record<string, ArrayBuffer>
  for (const key of responseKeys) {
    const value = (raw.response as unknown as Record<string, string>)[key]
    if (value) response[key] = bytesToArrayBuffer(Base64.toBytes(value))
  }

  return {
    attestationObject: bytesToArrayBuffer(Base64.toBytes(attestationObject)),
    clientDataJSON: bytesToArrayBuffer(Base64.toBytes(clientDataJSON)),
    id,
    publicKey: PublicKey.from(publicKey),
    raw: {
      id: raw.id,
      type: raw.type,
      authenticatorAttachment: raw.authenticatorAttachment,
      rawId: bytesToArrayBuffer(Base64.toBytes(raw.rawId)),
      response: response as unknown as Types.AuthenticatorResponse,
      getClientExtensionResults: () => ({}),
    },
  }
}

export declare namespace deserialize {
  type ErrorType =
    | Base64.toBytes.ErrorType
    | PublicKey.from.ErrorType
    | Errors.GlobalErrorType
}
