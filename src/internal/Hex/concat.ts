import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'

/**
 * Concatenates two or more {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.concat('0x123', '0x456')
 * // @log: '0x123456'
 * ```
 *
 * @param values - The {@link ox#Hex.Hex} values to concatenate.
 * @returns The concatenated {@link ox#Hex.Hex} value.
 */
export function concat(...values: readonly Hex.Hex[]): Hex.Hex {
  return `0x${(values as Hex.Hex[]).reduce((acc, x) => acc + x.replace('0x', ''), '')}`
}

export declare namespace concat {
  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
concat.parseError = (error: unknown) => error as Hex.concat.ErrorType
