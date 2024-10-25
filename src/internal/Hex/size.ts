import type * as Errors from '../../Errors.js'
import type { Hex } from './types.js'

/**
 * Retrieves the size of a {@link ox#Hex.Hex} value (in bytes).
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.size('0xdeadbeef')
 * // @log: 4
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to get the size of.
 * @returns The size of the {@link ox#Hex.Hex} value (in bytes).
 */
export function Hex_size(value: Hex): number {
  return Math.ceil((value.length - 2) / 2)
}

export declare namespace Hex_size {
  export type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
Hex_size.parseError = (error: unknown) => error as Hex_size.ErrorType
