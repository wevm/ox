import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'

/** Bech32 base32 alphabet (BIP-173). */
const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const alphabetMap = /*#__PURE__*/ (() => {
  const map: Record<string, number> = {}
  for (let i = 0; i < alphabet.length; i++) map[alphabet[i]!] = i
  return map
})()

/**
 * Encodes a {@link ox#Bytes.Bytes} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @example
 * ```ts twoslash
 * import { Base32, Bytes } from 'ox'
 *
 * const value = Base32.fromBytes(new Uint8Array([0x00, 0xff, 0x00]))
 * ```
 *
 * @param value - The byte array to encode.
 * @returns The Base32 encoded string.
 */
export function fromBytes(value: Bytes.Bytes): string {
  let bits = 0
  let acc = 0
  let result = ''
  for (const byte of value) {
    acc = (acc << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += alphabet[(acc >>> bits) & 0x1f]
    }
  }
  if (bits > 0) result += alphabet[(acc << (5 - bits)) & 0x1f]
  return result
}

export declare namespace fromBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Hex.Hex} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * const value = Base32.fromHex('0x00ff00')
 * ```
 *
 * @param value - The hex value to encode.
 * @returns The Base32 encoded string.
 */
export function fromHex(value: Hex.Hex): string {
  return fromBytes(Bytes.fromHex(value))
}

export declare namespace fromHex {
  type ErrorType = fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * const value = Base32.toBytes('qqsa0')
 * ```
 *
 * @param value - The Base32 encoded string.
 * @returns The decoded byte array.
 */
export function toBytes(value: string): Bytes.Bytes {
  const values: number[] = []
  for (const char of value) {
    const v = alphabetMap[char]
    if (v === undefined) throw new InvalidCharacterError({ character: char })
    values.push(v)
  }

  let bits = 0
  let acc = 0
  const bytes: number[] = []
  for (const v of values) {
    acc = (acc << 5) | v
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((acc >>> bits) & 0xff)
    }
  }
  return new Uint8Array(bytes)
}

export declare namespace toBytes {
  type ErrorType = InvalidCharacterError | Errors.GlobalErrorType
}

/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * const value = Base32.toHex('qqsa0')
 * ```
 *
 * @param value - The Base32 encoded string.
 * @returns The decoded hex string.
 */
export function toHex(value: string): Hex.Hex {
  return Hex.fromBytes(toBytes(value))
}

export declare namespace toHex {
  type ErrorType = toBytes.ErrorType | Errors.GlobalErrorType
}

/** Thrown when a Base32 string contains an invalid character. */
export class InvalidCharacterError extends Errors.BaseError {
  override readonly name = 'Base32.InvalidCharacterError'

  constructor({ character }: { character: string }) {
    super(`Invalid bech32 base32 character: "${character}".`)
  }
}
