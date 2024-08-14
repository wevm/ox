import { type AssertSizeErrorType, assertSize } from '../data/assertSize.js'
import { isBytes } from '../data/isBytes.js'
import { type IsHexErrorType, isHex } from '../data/isHex.js'
import {
  type PadLeftErrorType,
  type PadRightErrorType,
  padLeft,
  padRight,
} from '../data/pad.js'
import {
  IntegerOutOfRangeError,
  type IntegerOutOfRangeErrorType,
  InvalidTypeError,
  type InvalidTypeErrorType,
} from '../errors/data.js'
import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

export type ToHexParameters = {
  /** The size (in bytes) of the output hex value. */
  size?: number | undefined
}

export type ToHexErrorType =
  | BooleanToHexErrorType
  | BytesToHexErrorType
  | IsHexErrorType
  | InvalidTypeErrorType
  | NumberToHexErrorType
  | StringToHexErrorType
  | ErrorType

/**
 * Encodes an arbitrary value into a {@link Hex} value.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.from('Hello world')
 * // '0x48656c6c6f20776f726c6421'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.from(420)
 * // '0x1a4'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.from('Hello world', { size: 32 })
 * // '0x48656c6c6f20776f726c64210000000000000000000000000000000000000000'
 */
export function toHex(
  value: string | number | bigint | boolean | Bytes,
  options: ToHexParameters = {},
): Hex {
  if (isHex(value)) return value
  if (isBytes(value)) return bytesToHex(value, options)
  if (typeof value === 'number' || typeof value === 'bigint')
    return numberToHex(value, options)
  if (typeof value === 'string') return stringToHex(value, options)
  if (typeof value === 'boolean') return booleanToHex(value, options)
  throw new InvalidTypeError(typeof value)
}

export type BooleanToHexOptions = {
  /** The size (in bytes) of the output hex value. */
  size?: number | undefined
}

export type BooleanToHexErrorType =
  | AssertSizeErrorType
  | PadLeftErrorType
  | ErrorType

/**
 * Encodes a boolean into a {@link Hex} value.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromBoolean(true)
 * // '0x1'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromBoolean(false)
 * // '0x0'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromBoolean(true, { size: 32 })
 * // '0x0000000000000000000000000000000000000000000000000000000000000001'
 */
export function booleanToHex(
  value: boolean,
  options: BooleanToHexOptions = {},
): Hex {
  const hex: Hex = `0x${Number(value)}`
  if (typeof options.size === 'number') {
    assertSize(hex, options.size)
    return padLeft(hex, options.size)
  }
  return hex
}

export type BytesToHexOptions = {
  /** The size (in bytes) of the output hex value. */
  size?: number | undefined
}

export type BytesToHexErrorType =
  | AssertSizeErrorType
  | PadRightErrorType
  | ErrorType

/**
 * Encodes a {@link Bytes} value into a {@link Hex} value.
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.toHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * // '0x48656c6c6f20576f726c6421'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromBytes(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * // '0x48656c6c6f20576f726c6421'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromBytes(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]), { size: 32 })
 * // '0x48656c6c6f20576f726c642100000000000000000000000000000000000000000'
 */
export function bytesToHex(value: Bytes, options: BytesToHexOptions = {}): Hex {
  let string = ''
  for (let i = 0; i < value.length; i++) string += hexes[value[i]!]
  const hex = `0x${string}` as const

  if (typeof options.size === 'number') {
    assertSize(hex, options.size)
    return padRight(hex, options.size)
  }
  return hex
}

export type NumberToHexOptions =
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

export type NumberToHexErrorType =
  | IntegerOutOfRangeErrorType
  | PadLeftErrorType
  | ErrorType

/**
 * Encodes a number or bigint into a {@link Hex} value.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromNumber(420)
 * // '0x1a4'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromNumber(420, { size: 32 })
 * // '0x00000000000000000000000000000000000000000000000000000000000001a4'
 */
export function numberToHex(
  value_: number | bigint,
  options: NumberToHexOptions = {},
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

  const hex = `0x${(signed && value < 0
    ? (1n << BigInt(size * 8)) + BigInt(value)
    : value
  ).toString(16)}` as Hex
  if (size) return padLeft(hex, size) as Hex
  return hex
}

export type StringToHexOptions = {
  /** The size (in bytes) of the output hex value. */
  size?: number | undefined
}

export type StringToHexErrorType = BytesToHexErrorType | ErrorType

const encoder = /*#__PURE__*/ new TextEncoder()

/**
 * Encodes a UTF-8 string into a hex string

 * @example
 * import { Hex } from 'ox'
 * Hex.fromString('Hello World!')
 * // '0x48656c6c6f20576f726c6421'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.fromString('Hello World!', { size: 32 })
 * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 */
export function stringToHex(
  value_: string,
  options: StringToHexOptions = {},
): Hex {
  const value = encoder.encode(value_)
  return bytesToHex(value, options)
}
