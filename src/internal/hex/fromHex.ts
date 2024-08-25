import { assertSize as assertSize_bytes } from '../bytes/assertSize.js'
import { hexToBytes } from '../bytes/toBytes.js'
import { trimRight as trimRight_bytes } from '../bytes/trimBytes.js'
import { InvalidHexBooleanError, InvalidTypeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import { assertSize as assertSize_hex } from '../hex/assertSize.js'
import { trimLeft as trimLeft_hex } from '../hex/trimHex.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Decodes a {@link Types#Hex} value into a string, number, bigint, boolean, or {@link Types#Bytes}.
 *
 * - Docs: https://oxlib.sh/api/hex/to
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.to('0x1a4', 'number')
 * // 420
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.to('0x48656c6c6f20576f726c6421', 'string')
 * // 'Hello world'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.to('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', 'string', {
 *   size: 32,
 * })
 * // 'Hello world'
 * ```
 *
 * @alias ox!Hex.fromHex:function(1)
 */
export function fromHex<to extends fromHex.To>(
  hex: Hex,
  to: to | fromHex.To,
  options: fromHex.Options = {},
): fromHex.ReturnType<to> {
  if (to === 'number')
    return hexToNumber(hex, options) as fromHex.ReturnType<to>
  if (to === 'bigint')
    return hexToBigInt(hex, options) as fromHex.ReturnType<to>
  if (to === 'string')
    return hexToString(hex, options) as fromHex.ReturnType<to>
  if (to === 'boolean')
    return hexToBoolean(hex, options) as fromHex.ReturnType<to>
  if (to === 'Bytes') return hexToBytes(hex, options) as fromHex.ReturnType<to>
  throw new InvalidTypeError(to, 'string | Bytes | bigint | number | boolean')
}

export declare namespace fromHex {
  type To = 'string' | 'Bytes' | 'bigint' | 'number' | 'boolean'

  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ReturnType<to> =
    | (to extends 'string' ? string : never)
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'bigint' ? bigint : never)
    | (to extends 'number' ? number : never)
    | (to extends 'boolean' ? boolean : never)

  type ErrorType =
    | hexToNumber.ErrorType
    | hexToBigInt.ErrorType
    | hexToBoolean.ErrorType
    | hexToString.ErrorType
    | hexToBytes.ErrorType
    | InvalidTypeError
    | GlobalErrorType
}

/* v8 ignore next */
fromHex.parseError = (error: unknown) => error as fromHex.ErrorType

/**
 * Decodes a {@link Types#Hex} value into a BigInt.
 *
 * - Docs: https://oxlib.sh/api/hex/toBigInt
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toBigInt('0x1a4')
 * // 420n
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420n
 * ```
 *
 * @alias ox!Hex.hexToBigInt:function(1)
 */
export function hexToBigInt(
  hex: Hex,
  options: hexToBigInt.Options = {},
): bigint {
  const { signed } = options

  if (options.size) assertSize_hex(hex, options.size)

  const value = BigInt(hex)
  if (!signed) return value

  const size = (hex.length - 2) / 2
  const max = (1n << (BigInt(size) * 8n - 1n)) - 1n
  if (value <= max) return value

  return value - BigInt(`0x${'f'.padStart(size * 2, 'f')}`) - 1n
}

export declare namespace hexToBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = assertSize_hex.ErrorType | GlobalErrorType
}

/* v8 ignore next */
hexToBigInt.parseError = (error: unknown) => error as hexToBigInt.ErrorType

/**
 * Decodes a {@link Types#Hex} value into a boolean.
 *
 * - Docs: https://oxlib.sh/api/hex/toBoolean
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toBoolean('0x01')
 * // true
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toBoolean('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
 * // true
 * ```
 *
 * @alias ox!Hex.hexToBoolean:function(1)
 */
export function hexToBoolean(
  hex_: Hex,
  options: hexToBoolean.Options = {},
): boolean {
  let hex = hex_
  if (options.size) {
    assertSize_hex(hex, options.size)
    hex = trimLeft_hex(hex)
  }
  if (trimLeft_hex(hex) === '0x00') return false
  if (trimLeft_hex(hex) === '0x01') return true
  throw new InvalidHexBooleanError(hex)
}

export declare namespace hexToBoolean {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize_hex.ErrorType
    | trimLeft_hex.ErrorType
    | InvalidHexBooleanError
    | GlobalErrorType
}

/* v8 ignore next */
hexToBoolean.parseError = (error: unknown) => error as hexToBoolean.ErrorType

/**
 * Decodes a {@link Types#Hex} value into a number.
 *
 * - Docs: https://oxlib.sh/api/hex/toNumber
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toNumber('0x1a4')
 * // 420
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420
 * ```
 *
 * @alias ox!Hex.hexToNumber:function(1)
 */
export function hexToNumber(
  hex: Hex,
  options: hexToNumber.Options = {},
): number {
  const { signed, size } = options
  if (!signed && !size) return Number(hex)
  return Number(hexToBigInt(hex, options))
}

export declare namespace hexToNumber {
  type Options = hexToBigInt.Options

  type ErrorType = hexToBigInt.ErrorType | GlobalErrorType
}

/* v8 ignore next */
hexToNumber.parseError = (error: unknown) => error as hexToNumber.ErrorType

/**
 * Decodes a {@link Types#Hex} value into a UTF-8 string.
 *
 * - Docs: https://oxlib.sh/api/hex/toString
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toString('0x48656c6c6f20576f726c6421')
 * // 'Hello world!'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.toString('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *  size: 32,
 * })
 * // 'Hello world'
 * ```
 *
 * @alias ox!Hex.hexToString:function(1)
 */
export function hexToString(
  hex: Hex,
  options: hexToString.Options = {},
): string {
  const { size } = options

  let bytes = hexToBytes(hex)
  if (size) {
    assertSize_bytes(bytes, size)
    bytes = trimRight_bytes(bytes)
  }
  return new TextDecoder().decode(bytes)
}

export declare namespace hexToString {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize_bytes.ErrorType
    | hexToBytes.ErrorType
    | trimRight_bytes.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
hexToString.parseError = (error: unknown) => error as hexToString.ErrorType
