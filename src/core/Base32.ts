import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import {
  alphabet,
  alphabetMap,
  convertBits,
} from './internal/codec/bech32-base32.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
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
  const bytes = value instanceof Uint8Array ? value : Bytes.fromHex(value)
  const data5 = convertBits(bytes, 8, 5, true)
  const len = data5.length
  const out = new Array<string>(len)
  for (let i = 0; i < len; i++) out[i] = alphabet[data5[i]!]!
  return out.join('')
}

export declare namespace encode {
  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
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
  const buffer = new Uint8Array((len * 5) >> 3)
  let n = 0
  for (let i = 0; i < len; i++) {
    acc = (acc << 5) | values[i]!
    bits += 5
    if (bits >= 8) {
      bits -= 8
      buffer[n++] = (acc >>> bits) & 0xff
    }
  }
  const bytes = buffer.subarray(0, n)
  if (as === 'Hex') return Hex.fromBytes(bytes) as decode.ReturnType<as>
  return bytes as decode.ReturnType<as>
}

export declare namespace decode {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> = {
    /** The format to return the decoded value in. @default 'Bytes' */
    as?: as | 'Bytes' | 'Hex' | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType = InvalidCharacterError | Errors.GlobalErrorType
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
