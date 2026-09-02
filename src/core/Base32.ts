import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import {
  alphabet,
  alphabetMap,
  convertBits,
  InvalidPaddingError as SharedInvalidPaddingError,
} from './internal/codec/bech32-base32.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @example
 * ```ts twoslash
 * import { Base32, Bytes } from 'ox'
 *
 * const value = Base32.fromBytes(
 *   new Uint8Array([0x00, 0xff, 0x00])
 * )
 * ```
 *
 * @param value - The byte array to encode.
 * @returns The Base32 encoded string.
 */
export function fromBytes(value: Bytes.Bytes): string {
  const data5 = convertBits(value, 8, 5, true)
  const len = data5.length
  const out = Array.from<string>({ length: len })
  for (let i = 0; i < len; i++) out[i] = alphabet[data5[i]!]!
  return out.join('')
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
 * const value = Base32.toBytes('qrlsq')
 * ```
 *
 * @param value - The Base32 encoded string.
 * @returns The decoded byte array.
 */
export function toBytes(value: string): Bytes.Bytes {
  const len = value.length
  const values = Array.from<number>({ length: len })
  for (let i = 0; i < len; i++) {
    const ch = value[i]!
    const v = alphabetMap[ch]
    if (v === undefined) throw new InvalidCharacterError({ character: ch })
    values[i] = v
  }

  // `pad: false` enforces that leftover bits below a byte boundary are zero
  // (canonical form); a non-zero remainder means the string re-encodes to a
  // different Base32 string than it decoded from, so it is rejected here
  // rather than silently accepted.
  try {
    return Uint8Array.from(convertBits(values, 5, 8, false))
  } catch (error) {
    if (error instanceof SharedInvalidPaddingError)
      throw new InvalidPaddingError()
    throw error
  }
}

export declare namespace toBytes {
  type ErrorType =
    | InvalidCharacterError
    | InvalidPaddingError
    | Errors.GlobalErrorType
}

/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * const value = Base32.toHex('qrlsq')
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

/** Thrown when a Base32 string contains non-canonical (non-zero) trailing bits. */
export class InvalidPaddingError extends Errors.BaseError {
  override readonly name = 'Base32.InvalidPaddingError'

  constructor() {
    super('Non-canonical trailing bits in Base32 input.')
  }
}
