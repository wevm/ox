import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Concatenates two or more {@link Types#Bytes} or {@link Types#Hex}.
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/concat
 * - Docs (Hex): https://oxlib.sh/api/hex/concat
 *
 * @example
 * ```ts
 * import { Data } from 'ox'
 * const bytes = Data.concat(
 *   Bytes.from([1, 2, 3]),
 *   Bytes.from([4, 5, 6])
 * )
 * ```
 *
 * @example
 * ```ts
 * import { Data } from 'ox'
 * const hex = Data.concat('0x1234', '0x5678')
 * ```
 */
export function concat<value extends Hex | Bytes>(
  ...values: readonly value[]
): concat.ReturnType<value> {
  if (typeof values[0] === 'string')
    return concatHex(...(values as readonly Hex[])) as concat.ReturnType<value>
  return concatBytes(
    ...(values as readonly Bytes[]),
  ) as concat.ReturnType<value>
}

export declare namespace concat {
  type ReturnType<value extends Hex | Bytes> = value extends Hex ? Hex : Bytes

  type ErrorType = concatBytes.ErrorType | concatHex.ErrorType | GlobalErrorType
}

concat.parseError = (error: unknown) => error as concat.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

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

export function concatHex(...values: readonly Hex[]): Hex {
  return `0x${(values as Hex[]).reduce((acc, x) => acc + x.replace('0x', ''), '')}`
}

export declare namespace concatHex {
  type ErrorType = GlobalErrorType
}
