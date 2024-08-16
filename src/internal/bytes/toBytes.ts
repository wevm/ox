import { assertSize } from '../data/assertSize.js'
import { isBytes } from '../data/isBytes.js'
import { isHex } from '../data/isHex.js'
import { padLeft, padRight } from '../data/pad.js'
import { BaseError } from '../errors/base.js'
import { InvalidHexLengthError, InvalidTypeError } from '../errors/data.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import { numberToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

export declare namespace toBytes {
  export type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  export type ErrorType =
    | numberToBytes.ErrorType
    | booleanToBytes.ErrorType
    | hexToBytes.ErrorType
    | stringToBytes.ErrorType
    | isBytes.ErrorType
    | isHex.ErrorType
    | InvalidTypeError
    | ErrorType_
}

/**
 * Encodes an arbitrary value to {@link Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/from
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.from('Hello world')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.from(420)
 * // Uint8Array([1, 164])
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.from(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 */
export function toBytes(
  value: string | bigint | number | boolean | Hex | Bytes | readonly number[],
  options: toBytes.Options = {},
): Bytes {
  if (isBytes(value)) return value
  if (Array.isArray(value)) return Uint8Array.from(value)
  if (isHex(value)) return hexToBytes(value, options)
  if (typeof value === 'boolean') return booleanToBytes(value, options)
  if (typeof value === 'string') return stringToBytes(value, options)
  if (typeof value === 'number' || typeof value === 'bigint')
    return numberToBytes(value, options)
  throw new InvalidTypeError(
    typeof value,
    'string | bigint | number | boolean | Bytes | Hex | readonly number[]',
  )
}

export declare namespace booleanToBytes {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType = assertSize.ErrorType | padLeft.ErrorType | ErrorType_
}

/**
 * Encodes a boolean value into {@link Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromBoolean
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromBoolean(true)
 * // Uint8Array([1])
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromBoolean(true, { size: 32 })
 * // Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
 */
export function booleanToBytes(
  value: boolean,
  options: booleanToBytes.Options = {},
) {
  const { size } = options
  const bytes = new Uint8Array(1)
  bytes[0] = Number(value)
  if (typeof size === 'number') {
    assertSize(bytes, size)
    return padLeft(bytes, size)
  }
  return bytes
}

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

export declare namespace hexToBytes {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType = assertSize.ErrorType | padRight.ErrorType | ErrorType_
}

/**
 * Encodes a hex value into {@link Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromHex
 *
 * @example
 * import { Hex } from 'ox'
 * const data = Hex.toBytes('0x48656c6c6f20776f726c6421')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 */
export function hexToBytes(hex_: Hex, options: hexToBytes.Options = {}): Bytes {
  const { size } = options

  if (hex_.length % 2) throw new InvalidHexLengthError(hex_)

  let hex = hex_
  if (size) {
    assertSize(hex, size)
    hex = padRight(hex, size)
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

export declare namespace numberToBytes {
  export type Options = numberToHex.Options
  export type ErrorType =
    | numberToHex.ErrorType
    | hexToBytes.ErrorType
    | ErrorType_
}

/**
 * Encodes a number value into {@link Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromNumber
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromNumber(420)
 * // Uint8Array([1, 164])
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromNumber(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 */
export function numberToBytes(
  value: bigint | number,
  options?: numberToBytes.Options | undefined,
) {
  const hex = numberToHex(value, options)
  return hexToBytes(hex)
}

export declare namespace stringToBytes {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType = assertSize.ErrorType | padRight.ErrorType | ErrorType_
}

const encoder = /*#__PURE__*/ new TextEncoder()

/**
 * Encodes a UTF-8 string into a byte array.
 *
 * - Docs: https://oxlib.sh/api/bytes/fromString
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromString('Hello world!')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
 *
 * @example
 * import { Bytes } from 'ox'
 * const data = Bytes.fromString('Hello world!', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 */
export function stringToBytes(
  value: string,
  options: stringToBytes.Options = {},
): Bytes {
  const { size } = options

  const bytes = encoder.encode(value)
  if (typeof size === 'number') {
    assertSize(bytes, size)
    return padRight(bytes, size)
  }
  return bytes
}
