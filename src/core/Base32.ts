import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import {
  alphabet,
  alphabetMap,
  convertBits,
} from './internal/codec/bech32-base32.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @deprecated Use {@link Base32#encode} instead. Will be removed in a future major.
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
  const data5 = convertBits(value, 8, 5, true)
  const len = data5.length
  const out = new Array<string>(len)
  for (let i = 0; i < len; i++) out[i] = alphabet[data5[i]!]!
  return out.join('')
}

export declare namespace fromBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Hex.Hex} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @deprecated Use {@link Base32#encode} instead. Will be removed in a future major.
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
 * Encodes a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * Canonical alias for {@link Base32#fromBytes} / {@link Base32#fromHex}.
 *
 * @example
 * ```ts twoslash
 * import { Base32, Bytes } from 'ox'
 *
 * Base32.encode(new Uint8Array([0x00, 0xff, 0x00]))
 * // @log: 'qrlsq'
 *
 * Base32.encode('0x00ff00')
 * // @log: 'qrlsq'
 * ```
 *
 * @param value - The byte array or hex value to encode.
 * @returns The Base32 encoded string.
 */
export function encode(value: Bytes.Bytes | Hex.Hex): string {
  if (value instanceof Uint8Array) return fromBytes(value)
  return fromBytes(Bytes.fromHex(value))
}

export declare namespace encode {
  type ErrorType =
    | fromBytes.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to {@link ox#Bytes.Bytes}.
 *
 * @deprecated Use {@link Base32#decode} instead. Will be removed in a future major.
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
  const len = value.length
  const values = new Array<number>(len)
  for (let i = 0; i < len; i++) {
    const ch = value[i]!
    const v = alphabetMap[ch]
    if (v === undefined) throw new InvalidCharacterError({ character: ch })
    values[i] = v
  }

  let bits = 0
  let acc = 0
  // Worst-case: every 5 bits maps to up to 1 byte; preallocate.
  const bytes = new Uint8Array((len * 5) >> 3)
  let n = 0
  for (let i = 0; i < len; i++) {
    acc = (acc << 5) | values[i]!
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes[n++] = (acc >>> bits) & 0xff
    }
  }
  return bytes.subarray(0, n)
}

export declare namespace toBytes {
  type ErrorType = InvalidCharacterError | Errors.GlobalErrorType
}

/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to {@link ox#Hex.Hex}.
 *
 * @deprecated Use {@link Base32#decode} instead. Will be removed in a future major.
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

/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * Canonical alias for {@link Base32#toBytes} / {@link Base32#toHex}.
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * Base32.decode('qrlsq')
 * // @log: Uint8Array [ 0, 255, 0 ]
 *
 * Base32.decode('qrlsq', { as: 'Hex' })
 * // @log: '0x00ff00'
 * ```
 *
 * @param value - The Base32 encoded string.
 * @param options - Decoding options.
 * @returns The decoded value.
 */
export function decode<as extends 'Bytes' | 'Hex' = 'Bytes'>(
  value: string,
  options: decode.Options<as> = {},
): decode.ReturnType<as> {
  const { as = 'Bytes' } = options
  const bytes = toBytes(value)
  if (as === 'Hex') return Hex.fromBytes(bytes) as decode.ReturnType<as>
  return bytes as decode.ReturnType<as>
}

export declare namespace decode {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> = {
    /** The format to return the decoded value in. */
    as?: as | 'Bytes' | 'Hex' | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

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
