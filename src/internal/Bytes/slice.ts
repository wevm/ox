import { SliceOffsetOutOfBoundsError } from '../Errors/data.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Bytes_size } from './size.js'
import type { Bytes } from './types.js'

/**
 * Returns a section of a {@link Bytes#Bytes} value given a start/end bytes offset.
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
 * @param value - The {@link Bytes#Bytes} value.
 * @param start - Start offset.
 * @param end - End offset.
 * @param options - Slice options.
 * @returns Sliced {@link Bytes#Bytes} value.
 */
export function Bytes_slice(
  value: Bytes,
  start?: number | undefined,
  end?: number | undefined,
  options: Bytes_slice.Options = {},
): Bytes {
  const { strict } = options
  assertStartOffset(value, start)
  const value_ = value.slice(start, end)
  if (strict) assertEndOffset(value_, start, end)
  return value_
}

export declare namespace Bytes_slice {
  type Options = {
    /** Asserts that the sliced value is the same size as the given start/end offsets. */
    strict?: boolean | undefined
  }

  type ErrorType =
    | assertStartOffset.ErrorType
    | assertEndOffset.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_slice.parseError = (error: unknown) => error as Bytes_slice.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function assertStartOffset(value: Bytes, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > Bytes_size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: Bytes_size(value),
    })
}

/** @internal */
export declare namespace assertStartOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | Bytes_size.ErrorType
    | GlobalErrorType
}

/** @internal */
export function assertEndOffset(
  value: Bytes,
  start?: number | undefined,
  end?: number | undefined,
) {
  if (
    typeof start === 'number' &&
    typeof end === 'number' &&
    Bytes_size(value) !== end - start
  ) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: Bytes_size(value),
    })
  }
}

/** @internal */
export declare namespace assertEndOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | Bytes_size.ErrorType
    | GlobalErrorType
}
