import { SliceOffsetOutOfBoundsError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import { size } from './size.js'

/**
 * Returns a section of a {@link Types#Bytes} value given a start/end bytes offset.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.slice('0x0123456789', 1, 4) // '0x234567'
 * ```
 */
export function sliceHex(
  value_: Hex,
  start?: number | undefined,
  end?: number | undefined,
  options: sliceHex.Options = {},
): Hex {
  const { strict } = options
  assertStartOffset(value_, start)
  const value = `0x${value_
    .replace('0x', '')
    .slice((start ?? 0) * 2, (end ?? value_.length) * 2)}` as const
  if (strict) assertEndOffset(value, start, end)
  return value
}

export declare namespace sliceHex {
  type Options = {
    strict?: boolean | undefined
  }

  type ErrorType =
    | assertStartOffset.ErrorType
    | assertEndOffset.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
sliceHex.parseError = (error: unknown) => error as sliceHex.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function assertStartOffset(value: Hex, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: size(value),
    })
}

/** @internal */
export declare namespace assertStartOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | size.ErrorType
    | GlobalErrorType
}

/** @internal */
export function assertEndOffset(
  value: Hex,
  start?: number | undefined,
  end?: number | undefined,
) {
  if (
    typeof start === 'number' &&
    typeof end === 'number' &&
    size(value) !== end - start
  ) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: size(value),
    })
  }
}

/** @internal */
export declare namespace assertEndOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | size.ErrorType
    | GlobalErrorType
}
