import * as Base64 from '../../core/Base64.js'
import type * as Types from '../Types.js'

/** @internal */
export const base64UrlOptions = { url: true, pad: false } as const

/** @internal */
export const responseKeys = [
  'attestationObject',
  'authenticatorData',
  'clientDataJSON',
  'signature',
  'userHandle',
] as const

/** @internal */
export function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

/** @internal */
export function bufferSourceToBytes(source: Types.BufferSource): Uint8Array {
  if (source instanceof Uint8Array) return source
  if (source instanceof ArrayBuffer) return new Uint8Array(source)
  return new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
}

/**
 * Parsed authenticator data per W3C WebAuthn Level 2 §6.1.
 *
 * @internal
 */
export type ParsedAuthenticatorData = {
  /** Raw authenticator data bytes (zero-copy view). */
  bytes: Uint8Array
  /** SHA-256 hash of the relying party ID (32 bytes). */
  rpIdHash: Uint8Array
  /** Authenticator flags byte. */
  flags: number
  /** User Present flag. */
  up: boolean
  /** User Verified flag. */
  uv: boolean
  /** Backup Eligibility flag. */
  be: boolean
  /** Backup State flag. */
  bs: boolean
  /** Attested credential data flag. */
  at: boolean
  /** Extension data flag. */
  ed: boolean
  /** Signature counter (4-byte big-endian). */
  signCount: number
}

/**
 * Parses the fixed 37-byte header of authenticator data into rpIdHash, flags
 * and signature counter. Variable-length tail (attested credential data,
 * extensions) is the caller's responsibility.
 *
 * @internal
 */
export function parseAuthenticatorData(
  authenticatorData: Uint8Array,
): ParsedAuthenticatorData | undefined {
  if (authenticatorData.length < 37) return undefined
  const flags = authenticatorData[32]!
  return {
    bytes: authenticatorData,
    rpIdHash: authenticatorData.subarray(0, 32),
    flags,
    up: (flags & 0x01) === 0x01,
    uv: (flags & 0x04) === 0x04,
    be: (flags & 0x08) === 0x08,
    bs: (flags & 0x10) === 0x10,
    at: (flags & 0x40) === 0x40,
    ed: (flags & 0x80) === 0x80,
    signCount:
      ((authenticatorData[33]! << 24) |
        (authenticatorData[34]! << 16) |
        (authenticatorData[35]! << 8) |
        authenticatorData[36]!) >>>
      0,
  }
}

/**
 * Serializes the response fields of a WebAuthn `AuthenticatorResponse`-like
 * object into a base64url-encoded record. Falls back to getter methods
 * (e.g. `getAuthenticatorData()`) for browsers and passkey providers that
 * expose response fields only via getters.
 *
 * @internal
 */
export function serializeResponseFields(
  response: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of responseKeys) {
    let value = response[key]
    // Some providers expose response fields only via getter methods
    // (e.g. `getAuthenticatorData()`).
    if (!(value instanceof ArrayBuffer)) {
      const getter = `get${key[0]!.toUpperCase()}${key.slice(1)}`
      const fn = response[getter]
      if (typeof fn === 'function') value = (fn as () => unknown).call(response)
    }
    if (value instanceof ArrayBuffer)
      out[key] = Base64.encode(new Uint8Array(value), base64UrlOptions)
  }
  return out
}

/** @internal */
export function serializeExtensions(
  extensions: Types.AuthenticationExtensionsClientInputs,
): Types.AuthenticationExtensionsClientInputs<true> {
  const { prf, ...rest } = extensions
  return {
    ...rest,
    ...(prf && {
      prf: {
        eval: {
          first: Base64.encode(prf.eval.first, base64UrlOptions),
        },
      },
    }),
  }
}

/** @internal */
export function deserializeExtensions(
  extensions: Types.AuthenticationExtensionsClientInputs<true>,
): Types.AuthenticationExtensionsClientInputs {
  const { prf, ...rest } = extensions
  return {
    ...rest,
    ...(prf && {
      prf: {
        eval: {
          first: Base64.decode(prf.eval.first),
        },
      },
    }),
  }
}
