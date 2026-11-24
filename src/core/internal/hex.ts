import type * as Errors from '../Errors.js'
import * as Hex from '../Hex.js'

/** @internal */
export function assertSize(hex: Hex.Hex, size_: number): void {
  if (Hex.size(hex) > size_)
    throw new Hex.SizeOverflowError({
      givenSize: Hex.size(hex),
      maxSize: size_,
    })
}

/** @internal */
export declare namespace assertSize {
  type ErrorType =
    | Hex.size.ErrorType
    | Hex.SizeOverflowError
    | Errors.GlobalErrorType
}

/**
 * `value` checked against the range that `signed` and `size` give it, as the
 * non-negative value whose digits `Hex.fromNumber` writes: two's complement
 * when `value` is negative. `Bytes.fromNumber` writes the same digits as bytes.
 *
 * @internal
 */
export function toUnsigned(
  value: number | bigint,
  signed: boolean | undefined,
  size: number | undefined,
): bigint {
  const value_ = BigInt(value)

  let maxValue: bigint | number | undefined
  if (size) {
    if (signed) maxValue = (1n << (BigInt(size) * 8n - 1n)) - 1n
    else maxValue = 2n ** (BigInt(size) * 8n) - 1n
  } else if (typeof value === 'number') {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER)
  }

  // Negative values need a `size` to encode as two's complement.
  const minValue =
    size && typeof maxValue === 'bigint' && signed ? -maxValue - 1n : 0

  if ((maxValue && value_ > maxValue) || value_ < minValue) {
    const suffix = typeof value === 'bigint' ? 'n' : ''
    throw new Hex.IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : undefined,
      min: `${minValue}${suffix}`,
      signed,
      size,
      value: `${value}${suffix}`,
    })
  }

  return signed && value_ < 0 ? BigInt.asUintN(size! * 8, value_) : value_
}

/** @internal */
export function assertStartOffset(value: Hex.Hex, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > Hex.size(value) - 1)
    throw new Hex.SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: Hex.size(value),
    })
}

export declare namespace assertStartOffset {
  type ErrorType =
    | Hex.SliceOffsetOutOfBoundsError
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
  ) {
    throw new Hex.SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: Hex.size(value),
    })
  }
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

  // Same result as `hex_.replace('0x', '')`, without a search when the prefix
  // is present.
  const hex = hex_.startsWith('0x') ? hex_.slice(2) : hex_.replace('0x', '')
  if (hex.length > size * 2)
    throw new Hex.SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size,
      type: 'Hex',
    })

  return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0')}` as Hex.Hex
}

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

  let data = value.startsWith('0x') ? value.slice(2) : value.replace('0x', '')

  let sliceLength = 0
  for (let i = 0; i < data.length - 1; i++) {
    if (data.charCodeAt(dir === 'left' ? i : data.length - i - 1) === 48)
      sliceLength++
    else break
  }
  data =
    dir === 'left'
      ? data.slice(sliceLength)
      : data.slice(0, data.length - sliceLength)

  if (data === '0') return '0x'
  if (dir === 'right' && data.length % 2 === 1) return `0x${data}0`
  return `0x${data}` as trim.ReturnType
}

/** @internal */
export declare namespace trim {
  type Options = {
    dir?: 'left' | 'right' | undefined
  }

  type ReturnType = Hex.Hex

  type ErrorType = Errors.GlobalErrorType
}
