import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Concatenates two or more {@link Types#Hex}.
 *
 * @example
 * TODO
 */
export function Hex_concat(...values: readonly Hex[]): Hex {
  return `0x${(values as Hex[]).reduce((acc, x) => acc + x.replace('0x', ''), '')}`
}

export declare namespace Hex_concat {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_concat.parseError = (error: unknown) => error as Hex_concat.ErrorType
