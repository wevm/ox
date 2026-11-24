import type * as Errors from '../Errors.js'
import * as Hex from '../Hex.js'

/** @internal */
export function assertSize(hex: Hex.Hex, size_: number): void {
  const len = hex.length - 2
  // Ceil to match `Hex.size` semantics for odd-nibble inputs (e.g. `0x0`).
  const size = (len + 1) >> 1
  if (size > size_)
    throw new Hex.SizeOverflowError({ givenSize: size, maxSize: size_ })
}

/** @internal */
export declare namespace assertSize {
  type ErrorType =
    | Hex.size.ErrorType
    | Hex.SizeOverflowError
    | Errors.GlobalErrorType
}

/** @internal */
export function assertStartOffset(value: Hex.Hex, start?: number) {
  if (typeof start !== 'number' || start <= 0) return
  const size = (value.length - 2 + 1) >> 1
  if (start > size - 1)
    throw new Hex.SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size,
    })
}

export declare namespace assertStartOffset {
  type ErrorType =
    | Hex.SliceOffsetOutOfBoundsError
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function assertEndOffset(value: Hex.Hex, start?: number, end?: number) {
  if (typeof start !== 'number' || typeof end !== 'number') return
  const size = (value.length - 2 + 1) >> 1
  if (size !== end - start)
    throw new Hex.SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size,
    })
}

export declare namespace assertEndOffset {
  type ErrorType =
    | Hex.SliceOffsetOutOfBoundsError
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function pad(hex_: Hex.Hex, options: pad.Options = {}) {
  const { dir, size = 32 } = options

  if (size === 0) return hex_

  const target = size * 2
  if (typeof hex_ === 'string') {
    const prefixed = hex_.charCodeAt(0) === 48 && hex_.charCodeAt(1) === 120
    // Already the size: nothing to pad.
    if (prefixed && hex_.length === target + 2) return hex_
    // Up to 32 bytes of padding slice a literal instead of building a string.
    // The digits after `0x` are counted without slicing them off.
    const length = Math.max(0, hex_.length - 2)
    const missing = target - length
    if (length <= target && missing <= zeros.length) {
      const padding = zeros.slice(0, missing)
      if (dir !== 'right') return `0x${padding}${hex_.slice(2)}` as Hex.Hex
      // A `0x`-prefixed value is extended as is.
      return (
        prefixed ? `${hex_}${padding}` : `0x${hex_.slice(2)}${padding}`
      ) as Hex.Hex
    }
  }

  const hex = hex_.slice(2)
  if (hex.length > target)
    throw new Hex.SizeExceedsPaddingSizeError({
      size: (hex.length + 1) >> 1,
      targetSize: size,
      type: 'Hex',
    })

  return `0x${dir === 'right' ? hex.padEnd(target, '0') : hex.padStart(target, '0')}` as Hex.Hex
}

const zeros = '0000000000000000000000000000000000000000000000000000000000000000'

/** @internal */
export declare namespace pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }
  type ErrorType = Hex.SizeExceedsPaddingSizeError | Errors.GlobalErrorType
}

/** @internal */
export function trim(
  value: Hex.Hex,
  options: trim.Options = {},
): trim.ReturnType {
  const { dir = 'left' } = options

  const data = value.slice(2)

  let start = 0
  let end = data.length
  if (dir === 'left')
    while (start < end && data.charCodeAt(start) === 48 /* '0' */) start++
  else while (end > start && data.charCodeAt(end - 1) === 48 /* '0' */) end--

  if (start >= end) return '0x'
  if (dir === 'right' && (end - start) % 2 === 1)
    return `0x${data.slice(start, end)}0` as trim.ReturnType
  return `0x${data.slice(start, end)}` as trim.ReturnType
}

/** @internal */
export declare namespace trim {
  type Options = {
    dir?: 'left' | 'right' | undefined
  }

  type ReturnType = Hex.Hex

  type ErrorType = Errors.GlobalErrorType
}
