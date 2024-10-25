import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/**
 * Concatenates two or more {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const bytes = Bytes.concat(
 *   Bytes.from([1]),
 *   Bytes.from([69]),
 *   Bytes.from([420, 69]),
 * )
 * // @log: Uint8Array [ 1, 69, 420, 69 ]
 * ```
 *
 * @param values - Values to concatenate.
 * @returns Concatenated {@link ox#Bytes.Bytes}.
 */
export function concat(...values: readonly Bytes.Bytes[]): Bytes.Bytes {
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

export declare namespace concat {
  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
concat.parseError = (error: unknown) => error as Bytes.concat.ErrorType
