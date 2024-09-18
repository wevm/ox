import { BaseError } from '../Errors/base.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_assertSize } from '../Hex/assertSize.js'
import { Hex_InvalidLengthError } from '../Hex/errors.js'
import { Hex_fromNumber } from '../Hex/from.js'
import { Hex_padRight } from '../Hex/pad.js'
import type { Hex } from '../Hex/types.js'
import { Bytes_assertSize } from './assertSize.js'
import { Bytes_padLeft, Bytes_padRight } from './pad.js'
import type { Bytes } from './types.js'

/**
 * Instantiates a {@link ox#Bytes.Bytes} value from a `Uint8Array`, a hex string, or an array of unsigned 8-bit integers.
 *
 * :::tip
 *
 * To instantiate from a **Boolean**, **UTF-8 String**, or **Number**, use one of the following:
 *
 * - `Bytes.fromBoolean`
 *
 * - `Bytes.fromString`
 *
 * - `Bytes.fromNumber`
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.from([255, 124, 5, 4])
 * // @log: Uint8Array([255, 124, 5, 4])
 *
 * const data = Bytes.from('0xdeadbeef')
 * // @log: Uint8Array([222, 173, 190, 239])
 * ```
 *
 * @param value - Value to convert.
 * @returns A {@link ox#Bytes.Bytes} instance.
 */
export function Bytes_from(value: Hex | Bytes | readonly number[]): Bytes {
  if (value instanceof Uint8Array) return value
  if (typeof value === 'string') return Bytes_fromHex(value)
  return Bytes_fromArray(value)
}

export declare namespace Bytes_from {
  type ErrorType = GlobalErrorType
}

Bytes_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromBoolean.ErrorType

/**
 * Converts an array of unsigned 8-bit integers into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromArray([255, 124, 5, 4])
 * // @log: Uint8Array([255, 124, 5, 4])
 * ```
 *
 * @param value - Value to convert.
 * @returns A {@link ox#Bytes.Bytes} instance.
 */
export function Bytes_fromArray(value: readonly number[] | Uint8Array): Bytes {
  return value instanceof Uint8Array ? value : new Uint8Array(value)
}

export declare namespace Bytes_fromArray {
  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_padLeft.ErrorType
    | GlobalErrorType
}

Bytes_fromArray.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromBoolean.ErrorType

/**
 * Encodes a boolean value into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromBoolean(true)
 * // @log: Uint8Array([1])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromBoolean(true, { size: 32 })
 * // @log: Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
 * ```
 *
 * @param value - Boolean value to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function Bytes_fromBoolean(
  value: boolean,
  options: Bytes_fromBoolean.Options = {},
) {
  const { size } = options
  const bytes = new Uint8Array(1)
  bytes[0] = Number(value)
  if (typeof size === 'number') {
    Bytes_assertSize(bytes, size)
    return Bytes_padLeft(bytes, size)
  }
  return bytes
}

export declare namespace Bytes_fromBoolean {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_padLeft.ErrorType
    | GlobalErrorType
}

Bytes_fromBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromBoolean.ErrorType

// We use very optimized technique to convert hex string to byte array
const charCodeMap = {
  zero: 48,
  nine: 57,
  A: 65,
  F: 70,
  a: 97,
  f: 102,
} as const

function charCodeToBase16(char: number) {
  if (char >= charCodeMap.zero && char <= charCodeMap.nine)
    return char - charCodeMap.zero
  if (char >= charCodeMap.A && char <= charCodeMap.F)
    return char - (charCodeMap.A - 10)
  if (char >= charCodeMap.a && char <= charCodeMap.f)
    return char - (charCodeMap.a - 10)
  return undefined
}

/**
 * Encodes a {@link ox#Hex.Hex} value into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421', { size: 32 })
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 * ```
 *
 * @param hex - {@link ox#Hex.Hex} value to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function Bytes_fromHex(
  value: Hex,
  options: Bytes_fromHex.Options = {},
): Bytes {
  const { size } = options

  if (value.length % 2) throw new Hex_InvalidLengthError(value)

  let hex = value
  if (size) {
    Hex_assertSize(value, size)
    hex = Hex_padRight(value, size)
  }

  const hexString = hex.slice(2) as string

  const length = hexString.length / 2
  const bytes = new Uint8Array(length)
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++))
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++))
    if (nibbleLeft === undefined || nibbleRight === undefined) {
      throw new BaseError(
        `Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`,
      )
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight
  }
  return bytes
}

export declare namespace Bytes_fromHex {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_assertSize.ErrorType
    | Hex_padRight.ErrorType
    | Hex_InvalidLengthError
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_fromHex.parseError = (error: unknown) => error as Bytes_fromHex.ErrorType

/**
 * Encodes a number value into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromNumber(420)
 * // @log: Uint8Array([1, 164])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromNumber(420, { size: 4 })
 * // @log: Uint8Array([0, 0, 1, 164])
 * ```
 *
 * @param value - Number value to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function Bytes_fromNumber(
  value: bigint | number,
  options?: Bytes_fromNumber.Options | undefined,
) {
  const hex = Hex_fromNumber(value, options)
  return Bytes_fromHex(hex)
}

export declare namespace Bytes_fromNumber {
  export type Options = Hex_fromNumber.Options

  export type ErrorType =
    | Hex_fromNumber.ErrorType
    | Bytes_fromHex.ErrorType
    | GlobalErrorType
}

Bytes_fromNumber.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromNumber.ErrorType

const encoder = /*#__PURE__*/ new TextEncoder()

/**
 * Encodes a UTF-8 string into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromString('Hello world!')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromString('Hello world!', { size: 32 })
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 * ```
 *
 * @param value - UTF-8 string to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function Bytes_fromString(
  value: string,
  options: Bytes_fromString.Options = {},
): Bytes {
  const { size } = options

  const bytes = encoder.encode(value)
  if (typeof size === 'number') {
    Bytes_assertSize(bytes, size)
    return Bytes_padRight(bytes, size)
  }
  return bytes
}

export declare namespace Bytes_fromString {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_padRight.ErrorType
    | GlobalErrorType
}

Bytes_fromString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromString.ErrorType
