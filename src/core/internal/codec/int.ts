import * as Errors from '../../Errors.js'
import { bytesToHex } from './hex.js'

/**
 * Decodes a big-endian unsigned `Uint8Array` into a `bigint`. When `signed` is
 * true, applies twos-complement on the high bit.
 *
 * @internal
 */
export function bytesToBigInt(value: Uint8Array, signed?: boolean): bigint {
  const len = value.length
  if (len === 0) return 0n

  // Fast path: unsigned big-endian read using DataView for 8-byte chunks,
  // skipping the hex round-trip.
  if (!signed) {
    let val = 0n
    let i = 0
    if (len >= 8) {
      const view = new DataView(value.buffer, value.byteOffset, len)
      const tail = len & 7
      const fullEnd = len - tail
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

  // Signed: BigInt parses hex strings faster than the per-byte loop for
  // > 8-byte inputs in V8/JSC, so route through `bytesToHex`.
  const hex = bytesToHex(value)
  const n = hex === '0x' ? 0n : BigInt(hex)
  const max_unsigned = 1n << (BigInt(len) * 8n)
  const max_signed = max_unsigned >> 1n
  if (n < max_signed) return n
  return n - max_unsigned
}

/**
 * Decodes a big-endian unsigned `Uint8Array` into a number, throwing if the
 * value cannot be represented as a safe integer.
 *
 * @internal
 */
export function bytesToSafeNumber(value: Uint8Array, signed?: boolean): number {
  if (!signed && value.length <= 6) {
    // Small unsigned values fit in a number directly without BigInt round-trip.
    let n = 0
    for (let i = 0; i < value.length; i++) n = n * 256 + value[i]!
    return n
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

  const minBytes = bigIntByteLength(n)
  const length = size ?? Math.max(minBytes, 1)
  const out = new Uint8Array(length)
  // Right-aligned big-endian write.
  let i = length - 1
  let rem = n
  while (rem > 0n && i >= 0) {
    out[i--] = Number(rem & 0xffn)
    rem >>= 8n
  }
  return out
}

/** @internal */
export function bigIntByteLength(n: bigint): number {
  if (n === 0n) return 0
  let len = 0
  let v = n < 0n ? -n : n
  while (v > 0n) {
    len++
    v >>= 8n
  }
  return len
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
