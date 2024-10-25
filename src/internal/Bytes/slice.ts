import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/**
 * Returns a section of a {@link ox#Bytes.Bytes} value given a start/end bytes offset.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.slice(
 *   Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
 *   1,
 *   4,
 * )
 * // @log: Uint8Array([2, 3, 4])
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} value.
 * @param start - Start offset.
 * @param end - End offset.
 * @param options - Slice options.
 * @returns Sliced {@link ox#Bytes.Bytes} value.
 */
export function slice(
  value: Bytes.Bytes,
  start?: number | undefined,
  end?: number | undefined,
  options: Bytes.slice.Options = {},
): Bytes.Bytes {
  const { strict } = options
  assertStartOffset(value, start)
  const value_ = value.slice(start, end)
  if (strict) assertEndOffset(value_, start, end)
  return value_
}

export declare namespace slice {
  type Options = {
    /** Asserts that the sliced value is the same size as the given start/end offsets. */
    strict?: boolean | undefined
  }

  export type ErrorType =
    | assertStartOffset.ErrorType
    | assertEndOffset.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
slice.parseError = (error: unknown) => error as Bytes.slice.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function assertStartOffset(
  value: Bytes.Bytes,
  start?: number | undefined,
) {
  if (typeof start === 'number' && start > 0 && start > Bytes.size(value) - 1)
    throw new Bytes.SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: Bytes.size(value),
    })
}

export declare namespace assertStartOffset {
  export type ErrorType =
    | Bytes.SliceOffsetOutOfBoundsError
    | Bytes.size.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function assertEndOffset(
  value: Bytes.Bytes,
  start?: number | undefined,
  end?: number | undefined,
) {
  if (
    typeof start === 'number' &&
    typeof end === 'number' &&
    Bytes.size(value) !== end - start
  )
    throw new Bytes.SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: Bytes.size(value),
    })
}

export declare namespace assertEndOffset {
  type ErrorType =
    | Bytes.SliceOffsetOutOfBoundsError
    | Bytes.size.ErrorType
    | Errors.GlobalErrorType
}
