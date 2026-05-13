import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as internal from './internal/base58.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} to a Base58-encoded string.
 *
 * @deprecated Use {@link Base58#encode} instead. Will be removed in a future major.
 *
 * @example
 * ```ts twoslash
 * import { Base58, Bytes } from 'ox'
 *
 * const value = Base58.fromBytes(Bytes.fromString('Hello World!'))
 * // @log: '2NEpo7TZRRrLZSi2U'
 * ```
 *
 * @param value - The byte array to encode.
 * @returns The Base58 encoded string.
 */
export function fromBytes(value: Bytes.Bytes) {
  return internal.from(value)
}

export declare namespace fromBytes {
  type ErrorType = internal.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Hex.Hex} to a Base58-encoded string.
 *
 * @deprecated Use {@link Base58#encode} instead. Will be removed in a future major.
 *
 * @example
 * ```ts twoslash
 * import { Base58, Hex } from 'ox'
 *
 * const value = Base58.fromHex(Hex.fromString('Hello World!'))
 * // @log: '2NEpo7TZRRrLZSi2U'
 * ```
 *
 * @param value - The byte array to encode.
 * @returns The Base58 encoded string.
 */
export function fromHex(value: Hex.Hex) {
  return internal.from(value)
}

export declare namespace fromHex {
  type ErrorType = internal.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Encodes a string to a Base58-encoded string.
 *
 * @deprecated Use {@link Base58#encode} instead. Will be removed in a future major.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.fromString('Hello World!')
 * // @log: '2NEpo7TZRRrLZSi2U'
 * ```
 *
 * @param value - The string to encode.
 * @returns The Base58 encoded string.
 */
export function fromString(value: string) {
  return internal.from(Bytes.fromString(value))
}

export declare namespace fromString {
  type ErrorType = internal.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Bytes.Bytes}, {@link ox#Hex.Hex}, or string value to a Base58-encoded string.
 *
 * Canonical alias for {@link Base58#fromBytes} / {@link Base58#fromHex} / {@link Base58#fromString}.
 *
 * Strings prefixed with `0x` are decoded as hex; other strings are decoded as UTF-8.
 *
 * @example
 * ```ts twoslash
 * import { Base58, Bytes } from 'ox'
 *
 * Base58.encode(Bytes.fromString('Hello World!'))
 * // @log: '2NEpo7TZRRrLZSi2U'
 *
 * Base58.encode('0x48656c6c6f20576f726c6421')
 * // @log: '2NEpo7TZRRrLZSi2U'
 *
 * Base58.encode('Hello World!')
 * // @log: '2NEpo7TZRRrLZSi2U'
 * ```
 *
 * @param value - The byte array, hex value, or UTF-8 string to encode.
 * @returns The Base58 encoded string.
 */
export function encode(value: Bytes.Bytes | Hex.Hex | string): string {
  if (value instanceof Uint8Array) return internal.from(value)
  if (typeof value === 'string' && value.startsWith('0x'))
    return internal.from(value as Hex.Hex)
  return internal.from(Bytes.fromString(value))
}

export declare namespace encode {
  type ErrorType = internal.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a Base58-encoded string to a {@link ox#Bytes.Bytes}.
 *
 * @deprecated Use {@link Base58#decode} instead. Will be removed in a future major.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.toBytes('2NEpo7TZRRrLZSi2U')
 * // @log: Uint8Array [ 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33 ]
 * ```
 *
 * @param value - The Base58 encoded string.
 * @returns The decoded byte array.
 */
export function toBytes(value: string): Bytes.Bytes {
  return Bytes.fromHex(toHex(value))
}

export declare namespace toBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Decodes a Base58-encoded string to {@link ox#Hex.Hex}.
 *
 * @deprecated Use {@link Base58#decode} instead. Will be removed in a future major.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.toHex('2NEpo7TZRRrLZSi2U')
 * // @log: '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param value - The Base58 encoded string.
 * @returns The decoded hex string.
 */
export function toHex(value: string): Hex.Hex {
  if (value.length === 0) return '0x'

  let integer = BigInt(0)
  let pad = 0
  let checkPad = true

  for (let i = 0; i < value.length; i++) {
    const char = value[i]!

    // check for leading 1s
    if (checkPad && char === '1') pad++
    else checkPad = false

    // check for invalid characters
    if (typeof internal.alphabetToInteger[char] !== 'bigint')
      throw new InvalidCharacterError({ character: char })

    integer = integer * 58n
    integer = integer + internal.alphabetToInteger[char]!
  }

  let body = integer === 0n ? '' : integer.toString(16)
  if ((body.length & 1) !== 0) body = `0${body}`
  return `0x${'00'.repeat(pad)}${body}` as Hex.Hex
}

export declare namespace toHex {
  type ErrorType = InvalidCharacterError | Errors.GlobalErrorType
}

/**
 * Decodes a Base58-encoded string to a string.
 *
 * @deprecated Use {@link Base58#decode} instead. Will be removed in a future major.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.toString('2NEpo7TZRRrLZSi2U')
 * // @log: 'Hello World!'
 * ```
 *
 * @param value - The Base58 encoded string.
 * @returns The decoded string.
 */
export function toString(value: string): string {
  return Hex.toString(toHex(value))
}

export declare namespace toString {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Decodes a Base58-encoded string to a {@link ox#Bytes.Bytes}, {@link ox#Hex.Hex}, or UTF-8 string value.
 *
 * Canonical alias for {@link Base58#toBytes} / {@link Base58#toHex} / {@link Base58#toString}.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * Base58.decode('2NEpo7TZRRrLZSi2U')
 * // @log: Uint8Array [ 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33 ]
 *
 * Base58.decode('2NEpo7TZRRrLZSi2U', { as: 'Hex' })
 * // @log: '0x48656c6c6f20576f726c6421'
 *
 * Base58.decode('2NEpo7TZRRrLZSi2U', { as: 'String' })
 * // @log: 'Hello World!'
 * ```
 *
 * @param value - The Base58 encoded string.
 * @param options - Decoding options.
 * @returns The decoded value.
 */
export function decode<as extends 'Bytes' | 'Hex' | 'String' = 'Bytes'>(
  value: string,
  options: decode.Options<as> = {},
): decode.ReturnType<as> {
  const { as = 'Bytes' } = options
  if (as === 'String')
    return Hex.toString(toHex(value)) as decode.ReturnType<as>
  if (as === 'Hex') return toHex(value) as decode.ReturnType<as>
  return toBytes(value) as decode.ReturnType<as>
}

export declare namespace decode {
  type Options<
    as extends 'Bytes' | 'Hex' | 'String' = 'Bytes' | 'Hex' | 'String',
  > = {
    /** The format to return the decoded value in. */
    as?: as | 'Bytes' | 'Hex' | 'String' | undefined
  }

  type ReturnType<
    as extends 'Bytes' | 'Hex' | 'String' = 'Bytes' | 'Hex' | 'String',
  > =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)
    | (as extends 'String' ? string : never)

  type ErrorType =
    | toBytes.ErrorType
    | toHex.ErrorType
    | toString.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when a Base58 string contains an invalid character. */
export class InvalidCharacterError extends Errors.BaseError {
  override readonly name = 'Base58.InvalidCharacterError'

  constructor({ character }: { character: string }) {
    super(`Invalid Base58 character: "${character}".`)
  }
}
