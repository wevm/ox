import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Instantiates a {@link ox#Hex.Hex} value from a hex string or {@link ox#Bytes.Bytes} value.
 *
 * :::tip
 *
 * To instantiate from a **Boolean**, **String**, or **Number**, use one of the following:
 *
 * - `Hex.fromBoolean`
 *
 * - `Hex.fromString`
 *
 * - `Hex.fromNumber`
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Hex } from 'ox'
 *
 * Hex.from('0x48656c6c6f20576f726c6421')
 * // @log: '0x48656c6c6f20576f726c6421'
 *
 * Hex.from(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // @log: '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function from(
  value: Hex.Hex | Bytes.Bytes | readonly number[],
): Hex.Hex {
  if (value instanceof Uint8Array) return Hex.fromBytes(value)
  if (Array.isArray(value)) return Hex.fromBytes(new Uint8Array(value))
  return value as never
}

export declare namespace from {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
from.parseError = (error: unknown) => error as Hex.from.ErrorType
