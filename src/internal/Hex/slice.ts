import { SliceOffsetOutOfBoundsError } from '../Errors/data.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_size } from './size.js'
import type { Hex } from './types.js'

/**
 * Returns a section of a {@link Bytes#Bytes} value given a start/end bytes offset.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.slice('0x0123456789', 1, 4)
 * // @log: '0x234567'
 * ```
 *
 * @param value - The {@link Hex#Hex} value to slice.
 * @param start - The start offset (in bytes).
 * @param end - The end offset (in bytes).
 * @returns The sliced {@link Hex#Hex} value.
 */
export function Hex_slice(
  value_: Hex,
  start?: number | undefined,
  end?: number | undefined,
  options: Hex_slice.Options = {},
): Hex {
  const { strict } = options
  Hex_assertStartOffset(value_, start)
  const value = `0x${value_
    .replace('0x', '')
    .slice((start ?? 0) * 2, (end ?? value_.length) * 2)}` as const
  if (strict) Hex_assertEndOffset(value, start, end)
  return value
}

export declare namespace Hex_slice {
  interface Options {
    /** Asserts that the sliced value is the same size as the given start/end offsets. */
    strict?: boolean | undefined
  }

  type ErrorType =
    | Hex_assertStartOffset.ErrorType
    | Hex_assertEndOffset.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hex_slice.parseError = (error: unknown) => error as Hex_slice.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function Hex_assertStartOffset(value: Hex, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > Hex_size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: Hex_size(value),
    })
}

export declare namespace Hex_assertStartOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | Hex_size.ErrorType
    | GlobalErrorType
}

/** @internal */
export function Hex_assertEndOffset(
  value: Hex,
  start?: number | undefined,
  end?: number | undefined,
) {
  if (
    typeof start === 'number' &&
    typeof end === 'number' &&
    Hex_size(value) !== end - start
  ) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: Hex_size(value),
    })
  }
}

export declare namespace Hex_assertEndOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | Hex_size.ErrorType
    | GlobalErrorType
}
