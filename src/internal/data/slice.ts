import { SliceOffsetOutOfBoundsError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { isHex } from './isHex.js'
import { size } from './size.js'

/**
 * Returns a section of a {@link Types#Hex} or {@link Types#Bytes} value given a start/end bytes offset.
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/slice
 * - Docs (Hex): https://oxlib.sh/api/hex/slice
 *
 * @example
 * ```ts
 * import { Data } from 'ox'
 * Data.slice('0x0123456789', 1, 4) // '0x234567'
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.slice('0x0123456789', 1, 4) // '0x234567'
 * ```
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.slice(Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1, 4)
 * // Uint8Array([2, 3, 4])
 * ```
 */
export function slice<value extends Bytes | Hex>(
  value: value,
  start?: number | undefined,
  end?: number | undefined,
  options: slice.Options = {},
): slice.ReturnType<value> {
  const { strict } = options
  if (isHex(value, { strict: false }))
    return sliceHex(value as Hex, start, end, {
      strict,
    }) as slice.ReturnType<value>
  return sliceBytes(value as Bytes, start, end, {
    strict,
  }) as slice.ReturnType<value>
}

export declare namespace slice {
  type Options = {
    strict?: boolean | undefined
  }

  type ReturnType<value extends Bytes | Hex> = value extends Hex ? Hex : Bytes

  type ErrorType =
    | isHex.ErrorType
    | sliceBytes.ErrorType
    | sliceHex.ErrorType
    | GlobalErrorType
}

slice.parseError = (error: unknown) => error as slice.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

export function assertStartOffset(
  value: Hex | Bytes,
  start?: number | undefined,
) {
  if (typeof start === 'number' && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: size(value),
    })
}

export declare namespace assertStartOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | size.ErrorType
    | GlobalErrorType
}

export function assertEndOffset(
  value: Hex | Bytes,
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

export declare namespace assertEndOffset {
  type ErrorType =
    | SliceOffsetOutOfBoundsError
    | size.ErrorType
    | GlobalErrorType
}

export function sliceBytes(
  value_: Bytes,
  start?: number | undefined,
  end?: number | undefined,
  options: slice.Options = {},
): Bytes {
  const { strict } = options
  assertStartOffset(value_, start)
  const value = value_.slice(start, end)
  if (strict) assertEndOffset(value, start, end)
  return value
}

export declare namespace sliceBytes {
  type ErrorType =
    | assertStartOffset.ErrorType
    | assertEndOffset.ErrorType
    | GlobalErrorType
}

export function sliceHex(
  value_: Hex,
  start?: number | undefined,
  end?: number | undefined,
  options: slice.Options = {},
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
  type ErrorType =
    | assertStartOffset.ErrorType
    | assertEndOffset.ErrorType
    | GlobalErrorType
}
