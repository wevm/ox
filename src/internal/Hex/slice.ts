import type * as Errors from '../../Errors.js'
import { Hex_SliceOffsetOutOfBoundsError } from './errors.js'
import { Hex_size } from './size.js'
import type { Hex } from './types.js'

/**
 * Returns a section of a {@link ox#Bytes.Bytes} value given a start/end bytes offset.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.slice('0x0123456789', 1, 4)
 * // @log: '0x234567'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to slice.
 * @param start - The start offset (in bytes).
 * @param end - The end offset (in bytes).
 * @param options - Options.
 * @returns The sliced {@link ox#Hex.Hex} value.
 */
export function Hex_slice(
  value: Hex,
  start?: number | undefined,
  end?: number | undefined,
  options: Hex_slice.Options = {},
): Hex {
  const { strict } = options
  Hex_assertStartOffset(value, start)
  const value_ = `0x${value
    .replace('0x', '')
    .slice((start ?? 0) * 2, (end ?? value.length) * 2)}` as const
  if (strict) Hex_assertEndOffset(value_, start, end)
  return value_
}

export declare namespace Hex_slice {
  type Options = {
    /** Asserts that the sliced value is the same size as the given start/end offsets. */
    strict?: boolean | undefined
  }

  type ErrorType =
    | Hex_assertStartOffset.ErrorType
    | Hex_assertEndOffset.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
Hex_slice.parseError = (error: unknown) => error as Hex_slice.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function Hex_assertStartOffset(value: Hex, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > Hex_size(value) - 1)
    throw new Hex_SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: Hex_size(value),
    })
}

export declare namespace Hex_assertStartOffset {
  type ErrorType =
    | Hex_SliceOffsetOutOfBoundsError
    | Hex_size.ErrorType
    | Errors.GlobalErrorType
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
    throw new Hex_SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: Hex_size(value),
    })
  }
}

export declare namespace Hex_assertEndOffset {
  type ErrorType =
    | Hex_SliceOffsetOutOfBoundsError
    | Hex_size.ErrorType
    | Errors.GlobalErrorType
}
