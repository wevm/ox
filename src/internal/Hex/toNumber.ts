import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

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
export function toNumber(
  hex: Hex.Hex,
  options: Hex.toNumber.Options = {},
): number {
  const { signed, size } = options
  if (!signed && !size) return Number(hex)
  return Number(Hex.toBigInt(hex, options))
}

export declare namespace toNumber {
  type Options = Hex.toBigInt.Options

  type ErrorType = Hex.toBigInt.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
toNumber.parseError = (error: unknown) => error as Hex.toNumber.ErrorType
