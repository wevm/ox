import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { assertSize } from './assertSize.js'

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

/**
 * Encodes a {@link ox#Bytes.Bytes} value into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Hex } from 'ox'
 *
 * Hex.fromBytes(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // @log: '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function fromBytes(
  value: Bytes.Bytes,
  options: Hex.fromBytes.Options = {},
): Hex.Hex {
  let string = ''
  for (let i = 0; i < value.length; i++) string += hexes[value[i]!]
  const hex = `0x${string}` as const

  if (typeof options.size === 'number') {
    assertSize(hex, options.size)
    return Hex.padRight(hex, options.size)
  }
  return hex
}

export declare namespace fromBytes {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | Hex.padRight.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
fromBytes.parseError = (error: unknown) => error as Hex.fromBytes.ErrorType
