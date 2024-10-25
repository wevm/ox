import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import { assertSize } from '../Bytes/assertSize.js'

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
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
export function toString(
  hex: Hex.Hex,
  options: Hex.toString.Options = {},
): string {
  const { size } = options

  let bytes = Bytes.fromHex(hex)
  if (size) {
    assertSize(bytes, size)
    bytes = Bytes.trimRight(bytes)
  }
  return new TextDecoder().decode(bytes)
}

export declare namespace toString {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | Bytes.fromHex.ErrorType
    | Bytes.trimRight.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
toString.parseError = (error: unknown) => error as Hex.toString.ErrorType
