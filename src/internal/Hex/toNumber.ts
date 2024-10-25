import type * as Errors from '../../Errors.js'
import { Hex_toBigInt } from './toBigInt.js'
import type { Hex } from './types.js'

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

  type ErrorType = Hex_toBigInt.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
Hex_toNumber.parseError = (error: unknown) => error as Hex_toNumber.ErrorType
