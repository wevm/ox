import { SliceOffsetOutOfBoundsError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'
import { Bytes_size } from './size.js'

/**
 * Returns a section of a {@link Bytes#Bytes} value given a start/end bytes offset.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.slice(Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1, 4)
 * // Uint8Array([2, 3, 4])
 * ```
 */
export function Bytes_slice(
  value_: Bytes,
  start?: number | undefined,
  end?: number | undefined,
  options: Bytes_slice.Options = {},
): Bytes {
  const { strict } = options
  assertStartOffset(value_, start)
  const value = value_.slice(start, end)
  if (strict) assertEndOffset(value, start, end)
  return value
}

export declare namespace Bytes_slice {
  type Options = {
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
