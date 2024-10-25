import { BaseError } from '../Errors/base.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_assertSize } from '../Hex/assertSize.js'
import { Hex_InvalidLengthError } from '../Hex/errors.js'
import { Hex_padRight } from '../Hex/pad.js'
import type { Hex } from '../Hex/types.js'
import type { Bytes } from './types.js'

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
 * Encodes a {@link ox#Hex.Hex} value into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromHex('0x48656c6c6f20776f726c6421', { size: 32 })
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 * ```
 *
 * @param value - {@link ox#Hex.Hex} value to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function Bytes_fromHex(
  value: Hex,
  options: Bytes_fromHex.Options = {},
): Bytes {
  const { size } = options

  if (value.length % 2) throw new Hex_InvalidLengthError(value)

  let hex = value
  if (size) {
    Hex_assertSize(value, size)
    hex = Hex_padRight(value, size)
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
    | Hex_InvalidLengthError
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_fromHex.parseError = (error: unknown) => error as Bytes_fromHex.ErrorType
