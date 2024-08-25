import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Trims leading zeros from a {@link Types#Bytes} value.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.trimLeft(Bytes.from([0, 0, 0, 0, 1, 2, 3])) // Uint8Array([1, 2, 3])
 * ```
 */
export function trimLeft(value: Bytes): trimLeft.ReturnType {
  return trimBytes(value, { dir: 'left' })
}

export declare namespace trimLeft {
  type ReturnType = Bytes

  type ErrorType = trimBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
trimLeft.parseError = (error: unknown) => error as trimLeft.ErrorType

/**
 * Trims trailing zeros from a {@link Types#Bytes} value.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.trimRight(Bytes.from([1, 2, 3, 0, 0, 0, 0])) // Uint8Array([1, 2, 3])
 * ```
 */
export function trimRight(value: Bytes): trimRight.ReturnType {
  return trimBytes(value, { dir: 'right' })
}

export declare namespace trimRight {
  export type ReturnType = Bytes

  export type ErrorType = trimBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
trimRight.parseError = (error: unknown) => error as trimRight.ErrorType

/** @internal */
export function trimBytes(
  value: Bytes,
  options: trimBytes.Options = {},
): trimBytes.ReturnType {
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

  return data as trimBytes.ReturnType
}

/** @internal */
export declare namespace trimBytes {
  type Options = {
    dir?: 'left' | 'right' | undefined
  }

  type ReturnType = Bytes

  type ErrorType = GlobalErrorType
}
