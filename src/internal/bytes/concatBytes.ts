import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Concatenates two or more {@link Types#Bytes}.
 *
 * @example
 * TODO
 *
 * @alias ox!Bytes.concatBytes:function(1)
 */
export function concatBytes(...values: readonly Bytes[]): Bytes {
  let length = 0
  for (const arr of values) {
    length += arr.length
  }
  const result = new Uint8Array(length)
  for (let i = 0, index = 0; i < values.length; i++) {
    const arr = values[i]
    result.set(arr!, index)
    index += arr!.length
  }
  return result
}

export declare namespace concatBytes {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
concatBytes.parseError = (error: unknown) => error as concatBytes.ErrorType
