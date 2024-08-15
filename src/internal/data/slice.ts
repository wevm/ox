import {
  SliceOffsetOutOfBoundsError,
  type SliceOffsetOutOfBoundsErrorType,
} from '../errors/data.js'
import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { type IsHexErrorType, isHex } from './isHex.js'
import { type SizeErrorType, size } from './size.js'

export type SliceOptions = {
  strict?: boolean | undefined
}

export type SliceReturnType<value extends Bytes | Hex> = value extends Hex
  ? Hex
  : Bytes

export type SliceErrorType =
  | IsHexErrorType
  | SliceBytesErrorType
  | SliceHexErrorType
  | ErrorType

/**
 * Returns a section of a {@link Hex} or {@link Bytes} value given a start/end bytes offset.
 *
 * @example
 * import { Data } from 'ox'
 * Data.slice('0x0123456789', 1, 4) // '0x234567'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.slice('0x0123456789', 1, 4) // '0x234567'
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.slice(Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1, 4)
 * // Uint8Array([2, 3, 4])
 */
export function slice<value extends Bytes | Hex>(
  value: value,
  start?: number | undefined,
  end?: number | undefined,
  options: SliceOptions = {},
): SliceReturnType<value> {
  const { strict } = options
  if (isHex(value, { strict: false }))
    return sliceHex(value as Hex, start, end, {
      strict,
    }) as SliceReturnType<value>
  return sliceBytes(value as Bytes, start, end, {
    strict,
  }) as SliceReturnType<value>
}

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

type AssertStartOffsetErrorType =
  | SliceOffsetOutOfBoundsErrorType
  | SizeErrorType
  | ErrorType

function assertStartOffset(value: Hex | Bytes, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: size(value),
    })
}

type AssertEndOffsetErrorType =
  | SliceOffsetOutOfBoundsErrorType
  | SizeErrorType
  | ErrorType

function assertEndOffset(
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

type SliceBytesErrorType =
  | AssertStartOffsetErrorType
  | AssertEndOffsetErrorType
  | ErrorType

function sliceBytes(
  value_: Bytes,
  start?: number | undefined,
  end?: number | undefined,
  options: SliceOptions = {},
): Bytes {
  const { strict } = options
  assertStartOffset(value_, start)
  const value = value_.slice(start, end)
  if (strict) assertEndOffset(value, start, end)
  return value
}

type SliceHexErrorType =
  | AssertStartOffsetErrorType
  | AssertEndOffsetErrorType
  | ErrorType

function sliceHex(
  value_: Hex,
  start?: number | undefined,
  end?: number | undefined,
  options: SliceOptions = {},
): Hex {
  const { strict } = options
  assertStartOffset(value_, start)
  const value = `0x${value_
    .replace('0x', '')
    .slice((start ?? 0) * 2, (end ?? value_.length) * 2)}` as const
  if (strict) assertEndOffset(value, start, end)
  return value
}
