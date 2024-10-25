import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import { assertSize } from './assertSize.js'

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
export function toBigInt(
  hex: Hex.Hex,
  options: Hex.toBigInt.Options = {},
): bigint {
  const { signed } = options

  if (options.size) assertSize(hex, options.size)

  const value = BigInt(hex)
  if (!signed) return value

  const size = (hex.length - 2) / 2

  const max_unsigned = (1n << (BigInt(size) * 8n)) - 1n
  const max_signed = max_unsigned >> 1n

  if (value <= max_signed) return value
  return value - max_unsigned - 1n
}

export declare namespace toBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = assertSize.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
toBigInt.parseError = (error: unknown) => error as Hex.toBigInt.ErrorType
