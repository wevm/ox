import * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

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
 * @returns The sliced {@link ox#Hex.Hex} value.
 */
export function slice(
  value: Hex.Hex,
  start?: number | undefined,
  end?: number | undefined,
  options: Hex.slice.Options = {},
): Hex.Hex {
  const { strict } = options
  assertStartOffset(value, start)
  const value_ = `0x${value
    .replace('0x', '')
    .slice((start ?? 0) * 2, (end ?? value.length) * 2)}` as const
  if (strict) assertEndOffset(value_, start, end)
  return value_
}

export declare namespace slice {
  interface Options {
    /** Asserts that the sliced value is the same size as the given start/end offsets. */
    strict?: boolean | undefined
  }

  type ErrorType =
    | assertStartOffset.ErrorType
    | assertEndOffset.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
slice.parseError = (error: unknown) => error as Hex.slice.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function assertStartOffset(value: Hex.Hex, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > Hex.size(value) - 1)
    throw new Errors.SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: Hex.size(value),
    })
}

export declare namespace assertStartOffset {
  type ErrorType =
    | Errors.SliceOffsetOutOfBoundsError
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function assertEndOffset(
  value: Hex.Hex,
  start?: number | undefined,
  end?: number | undefined,
) {
  if (
    typeof start === 'number' &&
    typeof end === 'number' &&
    Hex.size(value) !== end - start
  )
    throw new Errors.SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: Hex.size(value),
    })
}

export declare namespace assertEndOffset {
  type ErrorType =
    | Errors.SliceOffsetOutOfBoundsError
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}
