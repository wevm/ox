import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/**
 * Trims leading zeros from a {@link ox#Bytes.Bytes} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.trimLeft(Bytes.from([0, 0, 0, 0, 1, 2, 3]))
 * // @log: Uint8Array([1, 2, 3])
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} value.
 * @returns Trimmed {@link ox#Bytes.Bytes} value.
 */
export function trimLeft(value: Bytes.Bytes): Bytes.Bytes {
  return trim(value, { dir: 'left' })
}

export declare namespace trimLeft {
  type ErrorType = trim.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
trimLeft.parseError = (error: unknown) => error as Bytes.trimLeft.ErrorType

/**
 * Trims trailing zeros from a {@link ox#Bytes.Bytes} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.trimRight(Bytes.from([1, 2, 3, 0, 0, 0, 0]))
 * // @log: Uint8Array([1, 2, 3])
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} value.
 * @returns Trimmed {@link ox#Bytes.Bytes} value.
 */
export function trimRight(value: Bytes.Bytes): Bytes.Bytes {
  return trim(value, { dir: 'right' })
}

export declare namespace trimRight {
  export type ErrorType = trim.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
trimRight.parseError = (error: unknown) => error as Bytes.trimRight.ErrorType

/** @internal */
export function trim(
  value: Bytes.Bytes,
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

  type ReturnType = Bytes.Bytes

  type ErrorType = Errors.GlobalErrorType
}
