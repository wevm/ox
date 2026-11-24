import * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as internal from './internal/base58.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} to a Base58-encoded string.
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
 * Decodes a Base58-encoded string to a {@link ox#Bytes.Bytes}.
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
  let integer = 0n
  let pad = 0
  let checkPad = true

  // Accumulate up to nine digits as a number, since 58^9 is below 2^53, and
  // fold each chunk into the BigInt at once.
  let chunk = 0
  let chunkBase = 1
  for (let i = 0; i < value.length; i++) {
    const char = value[i]!

    // check for leading 1s
    if (checkPad && char === '1') pad++
    else checkPad = false

    // check for invalid characters
    const digit = internal.alphabetToInteger[char]
    if (typeof digit !== 'bigint')
      throw new Error('invalid base58 character: ' + char)

    chunk = chunk * 58 + Number(digit)
    chunkBase *= 58
    if (chunkBase === 7_427_658_739_644_928) {
      integer = integer * 7_427_658_739_644_928n + BigInt(chunk)
      chunk = 0
      chunkBase = 1
    }
  }
  if (chunkBase > 1) integer = integer * BigInt(chunkBase) + BigInt(chunk)

  // Each leading '1' decodes to a zero byte, and the rest to whole bytes.
  const hex = integer === 0n ? '' : integer.toString(16)
  return `0x${'00'.repeat(pad)}${hex.length % 2 ? '0' : ''}${hex}` as Hex.Hex
}

export declare namespace toHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Decodes a Base58-encoded string to a string.
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
