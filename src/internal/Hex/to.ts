import { Bytes_assertSize } from '../Bytes/assertSize.js'
import { Bytes_fromHex } from '../Bytes/from.js'
import { Bytes_trimRight } from '../Bytes/trim.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_assertSize } from './assertSize.js'
import { Hex_InvalidHexBooleanError } from './errors.js'
import { Hex_trimLeft } from './trim.js'
import type { Hex } from './types.js'

/**
 * Decodes a {@link ox#Hex.Hex} value into a BigInt.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toBigInt('0x1a4')
 * // @log: 420n
 *
 * Hex.toBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // @log: 420n
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options -
 * @returns The decoded BigInt.
 */
export function Hex_toBigInt(
  hex: Hex,
  options: Hex_toBigInt.Options = {},
): bigint {
  const { signed } = options

  if (options.size) Hex_assertSize(hex, options.size)

  const value = BigInt(hex)
  if (!signed) return value

  const size = (hex.length - 2) / 2

  const max_unsigned = (1n << (BigInt(size) * 8n)) - 1n
  const max_signed = max_unsigned >> 1n

  if (value <= max_signed) return value
  return value - max_unsigned - 1n
}

export declare namespace Hex_toBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = Hex_assertSize.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_toBigInt.parseError = (error: unknown) => error as Hex_toBigInt.ErrorType

/**
 * Decodes a {@link ox#Hex.Hex} value into a boolean.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toBoolean('0x01')
 * // @log: true
 *
 * Hex.toBoolean('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
 * // @log: true
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options -
 * @returns The decoded boolean.
 */
export function Hex_toBoolean(
  hex: Hex,
  options: Hex_toBoolean.Options = {},
): boolean {
  let hex_ = hex
  if (options.size) {
    Hex_assertSize(hex, options.size)
    hex_ = Hex_trimLeft(hex_)
  }
  if (Hex_trimLeft(hex_) === '0x00') return false
  if (Hex_trimLeft(hex_) === '0x01') return true
  throw new Hex_InvalidHexBooleanError(hex_)
}

export declare namespace Hex_toBoolean {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_assertSize.ErrorType
    | Hex_trimLeft.ErrorType
    | Hex_InvalidHexBooleanError
    | GlobalErrorType
}

/* v8 ignore next */
Hex_toBoolean.parseError = (error: unknown) => error as Hex_toBoolean.ErrorType

/**
 * Decodes a {@link ox#Hex.Hex} value into a {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * const data = Hex.toBytes('0x48656c6c6f20776f726c6421')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options -
 * @returns The decoded {@link ox#Bytes.Bytes}.
 */
export function Hex_toBytes(
  hex: Hex,
  options: Hex_toBytes.Options = {},
): Bytes {
  return Bytes_fromHex(hex, options)
}

export declare namespace Hex_toBytes {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = Bytes_fromHex.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_toBytes.parseError = (error: unknown) => error as Hex_toBytes.ErrorType

/**
 * Decodes a {@link ox#Hex.Hex} value into a number.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toNumber('0x1a4')
 * // @log: 420
 *
 * Hex.toNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // @log: 420
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options -
 * @returns The decoded number.
 */
export function Hex_toNumber(
  hex: Hex,
  options: Hex_toNumber.Options = {},
): number {
  const { signed, size } = options
  if (!signed && !size) return Number(hex)
  return Number(Hex_toBigInt(hex, options))
}

export declare namespace Hex_toNumber {
  type Options = Hex_toBigInt.Options

  type ErrorType = Hex_toBigInt.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_toNumber.parseError = (error: unknown) => error as Hex_toNumber.ErrorType

/**
 * Decodes a {@link ox#Hex.Hex} value into a UTF-8 string.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toString('0x48656c6c6f20576f726c6421')
 * // @log: 'Hello world!'
 *
 * Hex.toString('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *  size: 32,
 * })
 * // @log: 'Hello world'
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options -
 * @returns The decoded UTF-8 string.
 */
export function Hex_toString(
  hex: Hex,
  options: Hex_toString.Options = {},
): string {
  const { size } = options

  let bytes = Bytes_fromHex(hex)
  if (size) {
    Bytes_assertSize(bytes, size)
    bytes = Bytes_trimRight(bytes)
  }
  return new TextDecoder().decode(bytes)
}

export declare namespace Hex_toString {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_fromHex.ErrorType
    | Bytes_trimRight.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hex_toString.parseError = (error: unknown) => error as Hex_toString.ErrorType
