import { type AssertSizeErrorType, assertSize } from '../data/assertSize.js'
import {
  type TrimLeftErrorType,
  type TrimRightErrorType,
  trimLeft,
  trimRight,
} from '../data/trim.js'
import {
  InvalidBytesBooleanError,
  InvalidTypeError,
  type InvalidTypeErrorType,
} from '../errors/data.js'
import type { ErrorType } from '../errors/error.js'
import {
  type HexToBigIntErrorType,
  type HexToNumberErrorType,
  hexToBigInt,
  hexToNumber,
} from '../hex/fromHex.js'
import { type BytesToHexErrorType, bytesToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'string' | 'hex' | 'bigint' | 'number' | 'boolean'

export type FromBytesOptions = {
  /** Size of the bytes. */
  size?: number | undefined
}

export type FromBytesReturnType<to extends To> =
  | (to extends 'string' ? string : never)
  | (to extends 'hex' ? Hex : never)
  | (to extends 'bigint' ? bigint : never)
  | (to extends 'number' ? number : never)
  | (to extends 'boolean' ? boolean : never)

export type FromBytesErrorType =
  | BytesToHexErrorType
  | BytesToBigIntErrorType
  | BytesToBooleanErrorType
  | BytesToNumberErrorType
  | BytesToStringErrorType
  | InvalidTypeErrorType
  | ErrorType

/**
 * Decodes {@link Bytes} into a UTF-8 string, {@link Hex}, number, bigint or boolean.
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.to(Bytes.from([1, 164]), 'number')
 * // 420
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.to(
 *   Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
 *   'string'
 * )
 * // 'Hello world'
 */
export function fromBytes<
  to extends 'string' | 'hex' | 'bigint' | 'number' | 'boolean',
>(
  bytes: Bytes,
  to: to | To,
  options: FromBytesOptions = {},
): FromBytesReturnType<to> {
  if (to === 'number')
    return bytesToNumber(bytes, options) as FromBytesReturnType<to>
  if (to === 'bigint')
    return bytesToBigInt(bytes, options) as FromBytesReturnType<to>
  if (to === 'boolean')
    return bytesToBoolean(bytes, options) as FromBytesReturnType<to>
  if (to === 'string')
    return bytesToString(bytes, options) as FromBytesReturnType<to>
  if (to === 'hex') return bytesToHex(bytes, options) as FromBytesReturnType<to>
  throw new InvalidTypeError(to)
}

export type BytesToBigIntOptions = {
  /** Whether or not the number of a signed representation. */
  signed?: boolean | undefined
  /** Size of the bytes. */
  size?: number | undefined
}

export type BytesToBigIntErrorType =
  | BytesToHexErrorType
  | HexToBigIntErrorType
  | ErrorType

/**
 * Decodes a byte array into a bigint.
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.toBigInt(Bytes.from([1, 164]))
 * // 420n
 */
export function bytesToBigInt(
  bytes: Bytes,
  options: BytesToBigIntOptions = {},
): bigint {
  const { size } = options
  if (typeof size !== 'undefined') assertSize(bytes, size)
  const hex = bytesToHex(bytes, options)
  return hexToBigInt(hex, options)
}

export type BytesToBooleanOptions = {
  /** Size of the bytes. */
  size?: number | undefined
}

export type BytesToBooleanErrorType =
  | AssertSizeErrorType
  | TrimLeftErrorType
  | ErrorType

/**
 * Decodes a byte array into a boolean.
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.toBoolean(Bytes.from([1]))
 * // true
 */
export function bytesToBoolean(
  bytes_: Bytes,
  options: BytesToBooleanOptions = {},
): boolean {
  const { size } = options
  let bytes = bytes_
  if (typeof size !== 'undefined') {
    assertSize(bytes, size)
    bytes = trimLeft(bytes)
  }
  if (bytes.length > 1 || bytes[0]! > 1)
    throw new InvalidBytesBooleanError(bytes)
  return Boolean(bytes[0])
}

export type BytesToNumberOptions = BytesToBigIntOptions

export type BytesToNumberErrorType =
  | BytesToHexErrorType
  | HexToNumberErrorType
  | ErrorType

/**
 * Decodes a byte array into a number.
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.toNumber(Bytes.from([1, 164]))
 * // 420
 */
export function bytesToNumber(
  bytes: Bytes,
  options: BytesToNumberOptions = {},
): number {
  const { size } = options
  if (typeof size !== 'undefined') assertSize(bytes, size)
  const hex = bytesToHex(bytes, options)
  return hexToNumber(hex, options)
}

export type BytesToStringOptions = {
  /** Size of the bytes. */
  size?: number | undefined
}

export type BytesToStringErrorType =
  | AssertSizeErrorType
  | TrimRightErrorType
  | ErrorType

const decoder = /*#__PURE__*/ new TextDecoder()

/**
 * Decodes a byte array into a UTF-8 string.
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.toString(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // 'Hello world'
 */
export function bytesToString(
  bytes_: Bytes,
  options: BytesToStringOptions = {},
): string {
  const { size } = options

  let bytes = bytes_
  if (typeof size !== 'undefined') {
    assertSize(bytes, size)
    bytes = trimRight(bytes)
  }
  return decoder.decode(bytes)
}
