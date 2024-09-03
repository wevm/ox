import { Bytes_assertSize } from '../Bytes/assertSize.js'
import { Bytes_fromHex } from '../Bytes/from.js'
import { Bytes_trimRight } from '../Bytes/trim.js'
import type { Bytes } from '../Bytes/types.js'
import { InvalidHexBooleanError, InvalidTypeError } from '../Errors/data.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_assertSize } from './assertSize.js'
import { Hex_trimLeft } from './trim.js'
import type { Hex } from './types.js'

/**
 * Decodes a {@link Hex#Hex} value into a string, number, bigint, boolean, or {@link Bytes#Bytes}.
 *
 * @example
 * Decode a Hex value into a **number**.
 *
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.to('0x1a4', 'number')
 * // @log: 420
 * ```
 *
 * @example
 * Decode a Hex value into a **UTF-8 string**.
 *
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.to('0x48656c6c6f20576f726c6421', 'string')
 * // @log: 'Hello world'
 * ```
 *
 * @example
 * Decode a Hex value into a **UTF-8 string** with a size of 32 bytes.
 *
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.to(
 *   '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000',
 *   'string',
 *   { size: 32 },
 * )
 * // @log: 'Hello world'
 * ```
 *
 * @param hex - The {@link Hex#Hex} value to decode.
 * @param to - The type to decode the {@link Hex#Hex} value into.
 * @param options -
 * @returns The decoded value.
 */
export function Hex_to<to extends Hex_to.To>(
  hex: Hex,
  to: to | Hex_to.To,
  options: Hex_to.Options = {},
): Hex_to.ReturnType<to> {
  if (to === 'number') return Hex_toNumber(hex, options) as never
  if (to === 'bigint') return Hex_toBigInt(hex, options) as never
  if (to === 'string') return Hex_toString(hex, options) as never
  if (to === 'boolean') return Hex_toBoolean(hex, options) as never
  if (to === 'Bytes') return Hex_toBytes(hex, options) as never
  throw new InvalidTypeError(to, 'string | Bytes | bigint | number | boolean')
}

export declare namespace Hex_to {
  type To = 'string' | 'Bytes' | 'bigint' | 'number' | 'boolean'

  interface Options {
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
    | Hex_toNumber.ErrorType
    | Hex_toBigInt.ErrorType
    | Hex_toBoolean.ErrorType
    | Hex_toString.ErrorType
    | Hex_toBytes.ErrorType
    | InvalidTypeError
    | GlobalErrorType
}

/* v8 ignore next */
Hex_to.parseError = (error: unknown) => error as Hex_to.ErrorType

/**
 * Decodes a {@link Hex#Hex} value into a BigInt.
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
 * @param hex - The {@link Hex#Hex} value to decode.
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
  const max = (1n << (BigInt(size) * 8n - 1n)) - 1n
  if (value <= max) return value

  return value - BigInt(`0x${'f'.padStart(size * 2, 'f')}`) - 1n
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
 * Decodes a {@link Hex#Hex} value into a boolean.
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
 * @param hex - The {@link Hex#Hex} value to decode.
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
  throw new InvalidHexBooleanError(hex_)
}

export declare namespace Hex_toBoolean {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_assertSize.ErrorType
    | Hex_trimLeft.ErrorType
    | InvalidHexBooleanError
    | GlobalErrorType
}

/* v8 ignore next */
Hex_toBoolean.parseError = (error: unknown) => error as Hex_toBoolean.ErrorType

/**
 * Decodes a {@link Hex#Hex} value into a {@link Bytes#Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * const data = Hex.toBytes('0x48656c6c6f20776f726c6421')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @param hex - The {@link Hex#Hex} value to decode.
 * @param options -
 * @returns The decoded {@link Bytes#Bytes}.
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
 * Decodes a {@link Hex#Hex} value into a number.
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
 * @param hex - The {@link Hex#Hex} value to decode.
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
 * Decodes a {@link Hex#Hex} value into a UTF-8 string.
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
 * @param hex - The {@link Hex#Hex} value to decode.
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
