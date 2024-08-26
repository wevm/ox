import { Bytes_isBytes } from '../bytes/isBytes.js'
import { IntegerOutOfRangeError, InvalidTypeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { Hex_assertSize } from './assertSize.js'
import { Hex_isHex } from './isHex.js'
import { Hex_padLeft, Hex_padRight } from './pad.js'

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

/**
 * Encodes an arbitrary value into a {@link Hex#Hex} value.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.from('Hello world')
 * // '0x48656c6c6f20776f726c6421'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.from(420)
 * // '0x1a4'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.from('Hello world', { size: 32 })
 * // '0x48656c6c6f20776f726c64210000000000000000000000000000000000000000'
 * ```
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
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
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
 * Encodes a boolean into a {@link Hex#Hex} value.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromBoolean(true)
 * // '0x1'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromBoolean(false)
 * // '0x0'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromBoolean(true, { size: 32 })
 * // '0x0000000000000000000000000000000000000000000000000000000000000001'
 * ```
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
 * Encodes a {@link Bytes#Bytes} value into a {@link Hex#Hex} value.
 *
 * - Docs: https://oxlib.sh/api/hex/fromBytes
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromBytes(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * // '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromBytes(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]), { size: 32 })
 * // '0x48656c6c6f20576f726c642100000000000000000000000000000000000000000'
 * ```
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
 * Encodes a number or bigint into a {@link Hex#Hex} value.
 *
 * - Docs: https://oxlib.sh/api/hex/fromNumber
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromNumber(420)
 * // '0x1a4'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromNumber(420, { size: 32 })
 * // '0x00000000000000000000000000000000000000000000000000000000000001a4'
 * ```
 */
export function Hex_fromNumber(
  value_: number | bigint,
  options: Hex_fromNumber.Options = {},
): Hex {
  const { signed, size } = options

  const value = BigInt(value_)

  let maxValue: bigint | number | undefined
  if (size) {
    if (signed) maxValue = (1n << (BigInt(size) * 8n - 1n)) - 1n
    else maxValue = 2n ** (BigInt(size) * 8n) - 1n
  } else if (typeof value_ === 'number') {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER)
  }

  const minValue = typeof maxValue === 'bigint' && signed ? -maxValue - 1n : 0

  if ((maxValue && value > maxValue) || value < minValue) {
    const suffix = typeof value_ === 'bigint' ? 'n' : ''
    throw new IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : undefined,
      min: `${minValue}${suffix}`,
      signed,
      size,
      value: `${value_}${suffix}`,
    })
  }

  const stringValue = (
    signed && value < 0 ? (1n << BigInt(size * 8)) + BigInt(value) : value
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
 * Encodes a UTF-8 string into a hex string
 *
 * - Docs: https://oxlib.sh/api/hex/fromString

 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromString('Hello World!')
 * // '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.fromString('Hello World!', { size: 32 })
 * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 * ```
 */
export function Hex_fromString(
  value_: string,
  options: Hex_fromString.Options = {},
): Hex {
  const value = encoder.encode(value_)
  return Hex_fromBytes(value, options)
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
