import type * as Errors from '../../Errors.js'
import { Bytes_assertSize } from '../Bytes/assertSize.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import { Bytes_trimRight } from '../Bytes/trim.js'
import type { Hex } from './types.js'

/**
 * Decodes a {@link ox#Hex.Hex} value into a string.
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
 * @returns The decoded string.
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
    | Errors.GlobalErrorType
}

/* v8 ignore next */
Hex_toString.parseError = (error: unknown) => error as Hex_toString.ErrorType
