import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Concatenates two or more {@link Types#Hex}.
 *
 * @example
 * TODO
 *
 * @alias ox!Hex.concatHex:function(1)
 */
export function concatHex(...values: readonly Hex[]): Hex {
  return `0x${(values as Hex[]).reduce((acc, x) => acc + x.replace('0x', ''), '')}`
}

export declare namespace concatHex {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
concatHex.parseError = (error: unknown) => error as concatHex.ErrorType
