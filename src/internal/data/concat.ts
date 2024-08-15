import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

export type ConcatReturnType<value extends Hex | Bytes> = value extends Hex
  ? Hex
  : Bytes

export type ConcatErrorType =
  | ConcatBytesErrorType
  | ConcatHexErrorType
  | ErrorType

/**
 * Concatenates two or more {@link Bytes} or {@link Hex}.
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
): ConcatReturnType<value> {
  if (typeof values[0] === 'string')
    return concatHex(...(values as readonly Hex[])) as ConcatReturnType<value>
  return concatBytes(...(values as readonly Bytes[])) as ConcatReturnType<value>
}

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

type ConcatBytesErrorType = ErrorType

/** @internal */
function concatBytes(...values: readonly Bytes[]): Bytes {
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

type ConcatHexErrorType = ErrorType

/** @internal */
function concatHex(...values: readonly Hex[]): Hex {
  return `0x${(values as Hex[]).reduce((acc, x) => acc + x.replace('0x', ''), '')}`
}
