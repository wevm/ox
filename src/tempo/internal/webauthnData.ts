import * as Bytes from '../../core/Bytes.js'
import * as Hex from '../../core/Hex.js'

/** Minimum size of `authenticatorData`: rpIdHash (32) + flags (1) + signCount (4). */
const minAuthenticatorDataSize = 37

const backslash = 0x5c
const closeBrace = 0x7d
const openBrace = 0x7b
const quote = 0x22

/**
 * Splits WebAuthn data (`authenticatorData || clientDataJSON`) into its parts.
 *
 * `clientDataJSON` is the JSON object that ends at the last byte, so its
 * opening brace is the one that pairs with the last byte. One backward pass
 * finds that brace and one `JSON.parse` validates the object, which keeps the
 * work linear in the size of the data.
 *
 * @param webauthnData - The concatenated WebAuthn data.
 * @returns The parts, or `undefined` when the data does not end with a JSON
 * object that starts at or after byte 37.
 */
export function split(webauthnData: Hex.Hex): split.ReturnType | undefined {
  if (Hex.size(webauthnData) <= minAuthenticatorDataSize) return undefined

  // `clientDataJSON` starts after the minimum `authenticatorData`.
  const bytes = Bytes.fromHex(Hex.slice(webauthnData, minAuthenticatorDataSize))
  const start = objectStart(bytes)
  if (start === -1) return undefined

  const clientDataJSON = Bytes.toString(bytes.subarray(start))
  try {
    JSON.parse(clientDataJSON)
  } catch {
    return undefined
  }
  return {
    authenticatorData: Hex.slice(
      webauthnData,
      0,
      minAuthenticatorDataSize + start,
    ),
    clientDataJSON,
  }
}

export declare namespace split {
  type ReturnType = {
    /** Authenticator data. */
    authenticatorData: Hex.Hex
    /** Client data JSON. */
    clientDataJSON: string
  }
}

/**
 * Finds the opening brace that pairs with a closing brace in the last byte,
 * or returns `-1`. Scans bytes rather than characters: UTF-8 never encodes a
 * multi-byte character with an ASCII byte, so each structural byte is a
 * structural character.
 */
function objectStart(bytes: Bytes.Bytes) {
  if (bytes[bytes.length - 1] !== closeBrace) return -1

  let depth = 0
  let inString = false
  for (let i = bytes.length - 1; i >= 0; i--) {
    const byte = bytes[i]
    if (byte === quote) {
      if (inString) {
        // A quote inside a string follows an odd number of backslashes.
        let escapes = 0
        while (bytes[i - 1 - escapes] === backslash) escapes++
        i -= escapes
        if (escapes % 2 === 1) continue
      }
      inString = !inString
    } else if (inString) continue
    else if (byte === closeBrace) depth++
    else if (byte === openBrace && --depth === 0) return i
  }
  return -1
}
