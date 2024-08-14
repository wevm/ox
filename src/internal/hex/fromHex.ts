import { type HexToBytesErrorType, hexToBytes } from '../bytes/toBytes.js'
import { type AssertSizeErrorType, assertSize } from '../data/assertSize.js'
import {
  type TrimLeftErrorType,
  type TrimRightErrorType,
  trimLeft,
  trimRight,
} from '../data/trim.js'
import {
  InvalidHexBooleanError,
  type InvalidHexBooleanErrorType,
  InvalidTypeError,
  type InvalidTypeErrorType,
} from '../errors/data.js'
import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'string' | 'bytes' | 'bigint' | 'number' | 'boolean'

export type FromHexParameters<to extends To> =
  | to
  | {
      /** Size (in bytes) of the hex value. */
      size?: number | undefined
      /** Type to convert to. */
      to: to
    }

export type FromHexReturnType<to> =
  | (to extends 'string' ? string : never)
  | (to extends 'bytes' ? Bytes : never)
  | (to extends 'bigint' ? bigint : never)
  | (to extends 'number' ? number : never)
  | (to extends 'boolean' ? boolean : never)

export type FromHexErrorType =
  | HexToNumberErrorType
  | HexToBigIntErrorType
  | HexToBooleanErrorType
  | HexToStringErrorType
  | HexToBytesErrorType
  | InvalidTypeErrorType
  | ErrorType

/**
 * Decodes a {@link Hex} value into a string, number, bigint, boolean, or {@link Bytes}.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.to('0x1a4', 'number')
 * // 420
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.to('0x48656c6c6f20576f726c6421', 'string')
 * // 'Hello world'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.to('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *   size: 32,
 *   to: 'string'
 * })
 * // 'Hello world'
 */
export function fromHex<to extends To>(
  hex: Hex,
  toOrOptions: FromHexParameters<to>,
): FromHexReturnType<to> {
  const options =
    typeof toOrOptions === 'string' ? { to: toOrOptions } : toOrOptions
  const to = options.to

  if (to === 'number') return hexToNumber(hex, options) as FromHexReturnType<to>
  if (to === 'bigint') return hexToBigInt(hex, options) as FromHexReturnType<to>
  if (to === 'string') return hexToString(hex, options) as FromHexReturnType<to>
  if (to === 'boolean')
    return HexToBoolean(hex, options) as FromHexReturnType<to>
  if (to === 'bytes') return hexToBytes(hex, options) as FromHexReturnType<to>
  throw new InvalidTypeError(to)
}

export type HexToBigIntOptions = {
  /** Whether or not the number of a signed representation. */
  signed?: boolean | undefined
  /** Size (in bytes) of the hex value. */
  size?: number | undefined
}

export type HexToBigIntErrorType = AssertSizeErrorType | ErrorType

/**
 * Decodes a {@link Hex} value into a BigInt.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBigInt('0x1a4')
 * // 420n
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420n
 */
export function hexToBigInt(
  hex: Hex,
  options: HexToBigIntOptions = {},
): bigint {
  const { signed } = options

  if (options.size) assertSize(hex, options.size)

  const value = BigInt(hex)
  if (!signed) return value

  const size = (hex.length - 2) / 2
  const max = (1n << (BigInt(size) * 8n - 1n)) - 1n
  if (value <= max) return value

  return value - BigInt(`0x${'f'.padStart(size * 2, 'f')}`) - 1n
}

export type HexToBooleanOptions = {
  /** Size (in bytes) of the hex value. */
  size?: number | undefined
}

export type HexToBooleanErrorType =
  | AssertSizeErrorType
  | InvalidHexBooleanErrorType
  | TrimLeftErrorType
  | ErrorType

/**
 * Decodes a {@link Hex} value into a boolean.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBoolean('0x01')
 * // true
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toBoolean('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
 * // true
 */
export function HexToBoolean(
  hex_: Hex,
  options: HexToBooleanOptions = {},
): boolean {
  let hex = hex_
  if (options.size) {
    assertSize(hex, options.size)
    hex = trimLeft(hex)
  }
  if (trimLeft(hex) === '0x00') return false
  if (trimLeft(hex) === '0x01') return true
  throw new InvalidHexBooleanError(hex)
}

export type HexToNumberOptions = HexToBigIntOptions

export type HexToNumberErrorType = HexToBigIntErrorType | ErrorType

/**
 * Decodes a {@link Hex} value into a number.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toNumber('0x1a4')
 * // 420
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420
 */
export function hexToNumber(
  hex: Hex,
  options: HexToNumberOptions = {},
): number {
  const { signed, size } = options
  if (!signed && !size) return Number(hex)
  return Number(hexToBigInt(hex, options))
}

export type HexToStringOptions = {
  /** Size (in bytes) of the hex value. */
  size?: number | undefined
}

export type HexToStringErrorType =
  | AssertSizeErrorType
  | HexToBytesErrorType
  | TrimRightErrorType
  | ErrorType

/**
 * Decodes a {@link Hex} value into a UTF-8 string.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toString('0x48656c6c6f20576f726c6421')
 * // 'Hello world!'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.toString('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *  size: 32,
 * })
 * // 'Hello world'
 */
export function hexToString(
  hex: Hex,
  options: HexToStringOptions = {},
): string {
  const { size } = options

  let bytes = hexToBytes(hex)
  if (size) {
    assertSize(bytes, size)
    bytes = trimRight(bytes)
  }
  return new TextDecoder().decode(bytes)
}
