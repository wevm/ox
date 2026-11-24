import * as Errors from '../../Errors.js'
import { bytesToHex } from './hex.js'

/**
 * Significant byte count up to which {@link bytesToBigInt} shifts 8-byte chunks
 * into the result. Each shift copies the result so far, so the loop is
 * quadratic, and parsing hex overtakes it past 64 bytes on Node 24 and Bun.
 *
 * @internal
 */
const shiftMaxBytes = 64

/**
 * Decodes a big-endian unsigned `Uint8Array` into a `bigint`. When `signed` is
 * true, applies twos-complement on the high bit.
 *
 * @internal
 */
export function bytesToBigInt(value: Uint8Array, signed?: boolean): bigint {
  const len = value.length
  if (len === 0) return 0n
  // Two's complement of the unsigned value, without the hex round-trip.
  if (signed) return BigInt.asIntN(len * 8, bytesToBigInt(value))

  // Skip leading zeros first: ABI words are 32 bytes but usually hold small
  // values, which then fit a Number and skip the BigInt arithmetic.
  let i = 0
  while (i < len && value[i] === 0) i++
  if (len - i <= 6) {
    let n = 0
    for (; i < len; i++) n = n * 256 + value[i]!
    return BigInt(n)
  }
  if (len - i > shiftMaxBytes) return BigInt(bytesToHex(value))
  // Up to a word of a fresh array of up to 64 bytes reads six bytes at a time:
  // V8 keeps such an array on its heap and would move it to an ArrayBuffer for
  // a DataView.
  if (len <= 64 && value.byteOffset === 0 && len - i <= 32) {
    let val = 0n
    for (let end = i + ((len - i) % 6 || 6); i < len; end += 6) {
      let chunk = 0
      for (; i < end; i++) chunk = chunk * 256 + value[i]!
      val = (val << 48n) | BigInt(chunk)
    }
    return val
  }

  // Unsigned big-endian read using DataView for 8-byte chunks.
  let val = 0n
  const fullEnd = len - ((len - i) & 7)
  if (i < fullEnd) {
    const view = new DataView(value.buffer, value.byteOffset, len)
    while (i < fullEnd) {
      val = (val << 64n) | view.getBigUint64(i, false)
      i += 8
    }
  }
  while (i < len) {
    val = (val << 8n) | BigInt(value[i]!)
    i++
  }
  return val
}

/**
 * Decodes a big-endian unsigned `Uint8Array` into a number, throwing if the
 * value cannot be represented as a safe integer.
 *
 * @internal
 */
export function bytesToSafeNumber(value: Uint8Array, signed?: boolean): number {
  if (!signed) {
    // Small unsigned values fit in a number directly without BigInt round-trip.
    const length = value.length
    let i = 0
    while (i < length && value[i] === 0) i++
    if (length - i <= 6) {
      let n = 0
      for (; i < length; i++) n = n * 256 + value[i]!
      return n
    }
  }
  const big = bytesToBigInt(value, signed)
  const num = Number(big)
  if (!Number.isSafeInteger(num)) {
    throw new IntegerOutOfRangeError({
      max: `${Number.MAX_SAFE_INTEGER}`,
      min: signed ? `${Number.MIN_SAFE_INTEGER}` : '0',
      signed,
      value: `${num}`,
    })
  }
  return num
}

/**
 * Encodes a number/bigint into a big-endian `Uint8Array` of the given byte
 * size (or minimal size when `size` is omitted).
 *
 * @internal
 */
export function bigIntToBytes(
  value: number | bigint,
  options: bigIntToBytes.Options = {},
): Uint8Array {
  const { signed, size } = options

  // A non-negative safe integer is written without BigInt arithmetic, unless
  // it might not fit in `size` bytes, which the general path reports.
  const small =
    typeof value === 'number'
      ? value
      : typeof value === 'bigint' && value >= 0n && value <= 0x1fffffffffffffn
        ? Number(value)
        : -1
  if (
    small >= 0 &&
    Number.isSafeInteger(small) &&
    (size === undefined || (Number.isInteger(size) && size > 0)) &&
    (!size || size >= 7 || small < 2 ** (size * 8 - (signed ? 1 : 0)))
  ) {
    let length = size
    if (length === undefined) {
      length = 1
      for (let v = small; v >= 256; v = Math.floor(v / 256)) length++
    }
    const out = new Uint8Array(length)
    for (
      let i = length - 1, v = small;
      v > 0 && i >= 0;
      i--, v = Math.floor(v / 256)
    )
      out[i] = v % 256
    return out
  }

  // Range check (mirrors `Hex.fromNumber` semantics).
  let value_: bigint
  if (typeof value === 'bigint') value_ = value
  else if (Number.isSafeInteger(value)) value_ = BigInt(value)
  else value_ = BigInt(value)

  let maxValue: bigint | undefined
  if (size) {
    if (signed) maxValue = (1n << (BigInt(size) * 8n - 1n)) - 1n
    else maxValue = (1n << (BigInt(size) * 8n)) - 1n
  } else if (typeof value === 'number') {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER)
  }

  const minValue = typeof maxValue === 'bigint' && signed ? -maxValue - 1n : 0n

  if ((maxValue && value_ > maxValue) || value_ < minValue) {
    const suffix = typeof value === 'bigint' ? 'n' : ''
    throw new IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : undefined,
      min: `${minValue}${suffix}`,
      signed,
      size,
      value: `${value}${suffix}`,
    })
  }

  // Normalize negatives to two's-complement before encoding.
  const n =
    signed && value_ < 0
      ? BigInt.asUintN((size ?? bigIntByteLength(-value_) + 1) * 8, value_)
      : value_

  // Shifting a byte off at a time copies the rest of the number each time, so
  // it is quadratic; past 64 bytes, reading the digits of `toString(16)` is
  // linear. (A hex decoder would be faster still, but adds its tables to every
  // bundle that encodes a number.)
  if (n >> 512n) {
    const hex = n.toString(16)
    const out = new Uint8Array(size ?? (hex.length + 1) >> 1)
    for (let i = hex.length, j = out.length - 1; i > 0; i -= 2, j--)
      out[j] = Number.parseInt(hex.slice(Math.max(i - 2, 0), i), 16)
    return out
  }

  const minBytes = bigIntByteLength(n)
  const length = size ?? Math.max(minBytes, 1)
  const out = new Uint8Array(length)
  // Right-aligned big-endian write, 32 bits per BigInt operation.
  let i = length - 1
  let rem = n
  while (rem > 0n && i >= 0) {
    let word = Number(rem & 0xffffffffn)
    rem >>= 32n
    for (let k = 0; k < 4 && i >= 0; k++, word >>>= 8) out[i--] = word & 0xff
  }
  return out
}

/** @internal */
export function bigIntByteLength(n: bigint): number {
  if (n === 0n) return 0
  // Shifting a byte off at a time copies the rest of the number each time;
  // counting hex digits is one conversion.
  return ((n < 0n ? -n : n).toString(16).length + 1) >> 1
}

/** Thrown when a value cannot be represented as a safe integer. */
export class IntegerOutOfRangeError extends Errors.BaseError {
  override readonly name = 'Hex.IntegerOutOfRangeError'

  constructor({
    max,
    min,
    signed,
    size,
    value,
  }: {
    max?: string | undefined
    min: string
    signed?: boolean | undefined
    size?: number | undefined
    value: string
  }) {
    super(
      `Number \`${value}\` is not in safe${
        size ? ` ${size * 8}-bit` : ''
      }${signed ? ' signed' : ' unsigned'} integer range ${max ? `(\`${min}\` to \`${max}\`)` : `(above \`${min}\`)`}`,
    )
  }
}

/** @internal */
export declare namespace bigIntToBytes {
  type Options = {
    /** Whether the value is signed. */
    signed?: boolean | undefined
    /** Size (in bytes) of the output. */
    size?: number | undefined
  }

  type ErrorType = IntegerOutOfRangeError | Errors.GlobalErrorType
}

/** @internal */
export declare namespace bytesToBigInt {
  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
export declare namespace bytesToSafeNumber {
  type ErrorType = IntegerOutOfRangeError | Errors.GlobalErrorType
}
