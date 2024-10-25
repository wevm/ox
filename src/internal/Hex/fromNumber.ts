import type * as Errors from '../../Errors.js'
import { Hex_IntegerOutOfRangeError } from './errors.js'
import { Hex_padLeft } from './pad.js'
import type { Hex } from './types.js'

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
    throw new Hex_IntegerOutOfRangeError({
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
    | Hex_IntegerOutOfRangeError
    | Hex_padLeft.ErrorType
    | Errors.GlobalErrorType
}

Hex_fromNumber.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Hex_fromNumber.ErrorType
