import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from './types.js'

/**
 * Concatenates two or more {@link Hex#Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.concat('0x123', '0x456')
 * // @log: '0x123456'
 * ```
 *
 * @param values - The {@link Hex#Hex} values to concatenate.
 * @returns The concatenated {@link Hex#Hex} value.
 */
export function Hex_concat(...values: readonly Hex[]): Hex {
  return `0x${(values as Hex[]).reduce((acc, x) => acc + x.replace('0x', ''), '')}`
}

export declare namespace Hex_concat {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_concat.parseError = (error: unknown) => error as Hex_concat.ErrorType
