import { Bytes_isBytes } from '../Bytes/isBytes.js'
import type { Bytes } from '../Bytes/types.js'
import { IntegerOutOfRangeError, InvalidTypeError } from '../Errors/data.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_assertSize } from './assertSize.js'
import { Hex_isHex } from './isHex.js'
import { Hex_padLeft, Hex_padRight } from './pad.js'
import type { Hex } from './types.js'

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

/**
 * Encodes an arbitrary value into a {@link ox#Hex.Hex} value.
 *
 * @example
 * An example of encoding a UTF-8 string into a hex value:
 *
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.from('Hello world')
 * // @log: '0x48656c6c6f20776f726c6421'
 * ```
 *
 * @example
 * An example of encoding a number into a hex value:
 *
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.from(420)
 * // @log: '0x1a4'
 * ```
 *
 * @example
 * An example of encoding a UTF-8 string into a hex value with a specified size:
 *
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.from('Hello world', { size: 32 })
 * // @log: '0x48656c6c6f20776f726c64210000000000000000000000000000000000000000'
 * ```
 *
 * @param value - The value to encode.
 * @param options - Encoding options.
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function Hex_from(
  value: string | number | bigint | boolean | readonly number[] | Bytes,
  options: Hex_from.Options = {},
): Hex {
  if (Hex_isHex(value)) return value
  if (Bytes_isBytes(value)) return Hex_fromBytes(value, options)
  if (Array.isArray(value))
    return Hex_fromBytes(Uint8Array.from(value), options)
  if (typeof value === 'number' || typeof value === 'bigint')
    return Hex_fromNumber(value, options)
  if (typeof value === 'string') return Hex_fromString(value, options)
  if (typeof value === 'boolean') return Hex_fromBoolean(value, options)
  throw new InvalidTypeError(
    typeof value,
    'string | number | bigint | boolean | Bytes | readonly number[]',
  )
}

export declare namespace Hex_from {
  interface Options {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  export type ErrorType =
    | Hex_fromBoolean.ErrorType
    | Hex_fromBytes.ErrorType
    | Hex_fromNumber.ErrorType
    | Hex_fromString.ErrorType
    | Hex_isHex.ErrorType
    | InvalidTypeError
    | GlobalErrorType
}

/* v8 ignore next */
Hex_from.parseError = (error: unknown) => error as Hex_from.ErrorType

/**
 * Encodes a boolean into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromBoolean(true)
 * // @log: '0x1'
 *
 * Hex.fromBoolean(false)
 * // @log: '0x0'
 *
 * Hex.fromBoolean(true, { size: 32 })
 * // @log: '0x0000000000000000000000000000000000000000000000000000000000000001'
 * ```
 *
 * @param value - The boolean value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function Hex_fromBoolean(
  value: boolean,
  options: Hex_fromBoolean.Options = {},
): Hex {
  const hex: Hex = `0x0${Number(value)}`
  if (typeof options.size === 'number') {
    Hex_assertSize(hex, options.size)
    return Hex_padLeft(hex, options.size)
  }
  return hex
}

export declare namespace Hex_fromBoolean {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_assertSize.ErrorType
    | Hex_padLeft.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hex_fromBoolean.parseError = (error: unknown) =>
  error as Hex_fromBoolean.ErrorType

/**
 * Encodes a {@link ox#Bytes.Bytes} value into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromBytes(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * // @log: '0x48656c6c6f20576f726c6421'
 *
 * Hex.fromBytes(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]), { size: 32 })
 * // @log: '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function Hex_fromBytes(
  value: Bytes,
  options: Hex_fromBytes.Options = {},
): Hex {
  let string = ''
  for (let i = 0; i < value.length; i++) string += hexes[value[i]!]
  const hex = `0x${string}` as const

  if (typeof options.size === 'number') {
    Hex_assertSize(hex, options.size)
    return Hex_padRight(hex, options.size)
  }
  return hex
}

export declare namespace Hex_fromBytes {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_assertSize.ErrorType
    | Hex_padRight.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hex_fromBytes.parseError = (error: unknown) => error as Hex_fromBytes.ErrorType

/**
 * Encodes a number or bigint into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromNumber(420)
 * // @log: '0x1a4'
 *
 * Hex.fromNumber(420, { size: 32 })
 * // @log: '0x00000000000000000000000000000000000000000000000000000000000001a4'
 * ```
 *
 * @param value - The number or bigint value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function Hex_fromNumber(
  value: number | bigint,
  options: Hex_fromNumber.Options = {},
): Hex {
  const { signed, size } = options

  const value_ = BigInt(value)

  let maxValue: bigint | number | undefined
  if (size) {
    if (signed) maxValue = (1n << (BigInt(size) * 8n - 1n)) - 1n
    else maxValue = 2n ** (BigInt(size) * 8n) - 1n
  } else if (typeof value === 'number') {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER)
  }

  const minValue = typeof maxValue === 'bigint' && signed ? -maxValue - 1n : 0

  if ((maxValue && value_ > maxValue) || value_ < minValue) {
    const suffix = typeof value === 'bigint' ? 'n' : ''
    throw new IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : undefined,
      min: `${minValue}${suffix}`,
      signed,
      size,
      value: `${value}${suffix}`,
    })
  }

  const stringValue = (
    signed && value_ < 0 ? (1n << BigInt(size * 8)) + BigInt(value_) : value_
  ).toString(16)

  const hex =
    `0x${stringValue.length % 2 === 0 ? stringValue : `0${stringValue}`}` as Hex
  if (size) return Hex_padLeft(hex, size) as Hex
  return hex
}

export declare namespace Hex_fromNumber {
  type Options =
    | {
        /** Whether or not the number of a signed representation. */
        signed?: boolean | undefined
        /** The size (in bytes) of the output hex value. */
        size: number
      }
    | {
        signed?: undefined
        /** The size (in bytes) of the output hex value. */
        size?: number | undefined
      }

  type ErrorType =
    | IntegerOutOfRangeError
    | Hex_padLeft.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hex_fromNumber.parseError = (error: unknown) =>
  error as Hex_fromNumber.ErrorType

const encoder = /*#__PURE__*/ new TextEncoder()

/**
 * Encodes a UTF-8 string into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 * Hex.fromString('Hello World!')
 * // '0x48656c6c6f20576f726c6421'
 *
 * Hex.fromString('Hello World!', { size: 32 })
 * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 * ```
 *
 * @param value - The string value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function Hex_fromString(
  value: string,
  options: Hex_fromString.Options = {},
): Hex {
  return Hex_fromBytes(encoder.encode(value), options)
}

export declare namespace Hex_fromString {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType = Hex_fromBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_fromString.parseError = (error: unknown) =>
  error as Hex_fromString.ErrorType
