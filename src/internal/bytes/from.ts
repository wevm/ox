import { BaseError } from '../errors/base.js'
import { InvalidHexLengthError, InvalidTypeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hex_assertSize } from '../hex/assertSize.js'
import { Hex_fromNumber } from '../hex/from.js'
import { Hex_isHex } from '../hex/isHex.js'
import { Hex_padRight } from '../hex/pad.js'
import type { Bytes, Hex } from '../types/data.js'
import { Bytes_assertSize } from './assertSize.js'
import { Bytes_isBytes } from './isBytes.js'
import { Bytes_padLeft, Bytes_padRight } from './pad.js'

/**
 * Encodes an arbitrary value to {@link Bytes#Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 * const data = Bytes.from('Hello world')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 * const data = Bytes.from(420)
 * // Uint8Array([1, 164])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 * const data = Bytes.from(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 * ```
 *
 * @param value - An arbitrary value to encode to Bytes.
 * @param options - Encoding options
 */
export function Bytes_from(
  value: string | bigint | number | boolean | Hex | Bytes | readonly number[],
  options: Bytes_from.Options = {},
): Bytes {
  if (Bytes_isBytes(value)) return value
  if (Array.isArray(value)) return Uint8Array.from(value)
  if (Hex_isHex(value)) return Bytes_fromHex(value, options)
  if (typeof value === 'boolean') return Bytes_fromBoolean(value, options)
  if (typeof value === 'string') return Bytes_fromString(value, options)
  if (typeof value === 'number' || typeof value === 'bigint')
    return Bytes_fromNumber(value, options)
  throw new InvalidTypeError(
    typeof value,
    'string | bigint | number | boolean | Bytes | Hex | readonly number[]',
  )
}

export declare namespace Bytes_from {
  export type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  export type ErrorType =
    | Bytes_fromNumber.ErrorType
    | Bytes_fromBoolean.ErrorType
    | Bytes_fromHex.ErrorType
    | Bytes_fromString.ErrorType
    | Bytes_isBytes.ErrorType
    | Hex_isHex.ErrorType
    | InvalidTypeError
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_from.parseError = (error: unknown) => error as Bytes_from.ErrorType

/**
 * Encodes a boolean value into {@link Bytes#Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromBoolean
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromBoolean(true)
 * // Uint8Array([1])
 * ```
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromBoolean(true, { size: 32 })
 * // Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
 * ```
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
 * Encodes a hex value into {@link Bytes#Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromHex
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 * ```
 */
export function Bytes_fromHex(
  hex_: Hex,
  options: Bytes_fromHex.Options = {},
): Bytes {
  const { size } = options

  if (hex_.length % 2) throw new InvalidHexLengthError(hex_)

  let hex = hex_
  if (size) {
    Hex_assertSize(hex, size)
    hex = Hex_padRight(hex, size)
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
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_fromHex.parseError = (error: unknown) => error as Bytes_fromHex.ErrorType

/**
 * Encodes a number value into {@link Bytes#Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromNumber
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromNumber(420)
 * // Uint8Array([1, 164])
 * ```
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromNumber(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 * ```
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

/* v8 ignore next */
Bytes_fromNumber.parseError = (error: unknown) =>
  error as Bytes_fromNumber.ErrorType

const encoder = /*#__PURE__*/ new TextEncoder()

/**
 * Encodes a UTF-8 string into a byte array.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromString
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromString('Hello world!')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
 * ```
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const data = Bytes.fromString('Hello world!', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 * ```
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

/* v8 ignore next */
Bytes_fromString.parseError = (error: unknown) =>
  error as Bytes_fromString.ErrorType
