import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'

/**
 * Trims leading zeros from a {@link Bytes#Bytes} value.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.trimLeft(Bytes.from([0, 0, 0, 0, 1, 2, 3])) // Uint8Array([1, 2, 3])
 * ```
 */
export function Bytes_trimLeft(value: Bytes): Bytes_trimLeft.ReturnType {
  return trim(value, { dir: 'left' })
}

export declare namespace Bytes_trimLeft {
  type ReturnType = Bytes

  type ErrorType = trim.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bytes_trimLeft.parseError = (error: unknown) =>
  error as Bytes_trimLeft.ErrorType

/**
 * Trims trailing zeros from a {@link Bytes#Bytes} value.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.trimRight(Bytes.from([1, 2, 3, 0, 0, 0, 0])) // Uint8Array([1, 2, 3])
 * ```
 */
export function Bytes_trimRight(value: Bytes): Bytes_trimRight.ReturnType {
  return trim(value, { dir: 'right' })
}

export declare namespace Bytes_trimRight {
  export type ReturnType = Bytes

  export type ErrorType = trim.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bytes_trimRight.parseError = (error: unknown) =>
  error as Bytes_trimRight.ErrorType

/** @internal */
export function trim(
  value: Bytes,
  options: trim.Options = {},
): trim.ReturnType {
  const { dir = 'left' } = options

  let data = value

  let sliceLength = 0
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === 'left' ? i : data.length - i - 1]!.toString() === '0')
      sliceLength++
    else break
  }
  data =
    dir === 'left'
      ? data.slice(sliceLength)
      : data.slice(0, data.length - sliceLength)

  return data as trim.ReturnType
}

/** @internal */
export declare namespace trim {
  type Options = {
    dir?: 'left' | 'right' | undefined
  }

  type ReturnType = Bytes

  type ErrorType = GlobalErrorType
}