import {
  SizeExceedsPaddingSizeError,
  type SizeExceedsPaddingSizeErrorType,
} from '../errors/data.js'
import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

export type PadLeftReturnType<value extends Bytes | Hex> = PadReturnType<value>

export type PadLeftErrorType = PadErrorType

/**
 * Pads a {@link Bytes} or {@link Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.padLeft(Bytes.from([1]), 4)
 * // Uint8Array([0, 0, 0, 1])
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.padLeft('0x1234', 4)
 * // '0x00001234'
 */
export function padLeft<value extends Bytes | Hex>(
  value: value,
  size?: number | undefined,
): PadLeftReturnType<value> {
  return pad(value, { dir: 'left', size })
}

export type PadRightReturnType<value extends Bytes | Hex> = PadReturnType<value>

export type PadRightErrorType = PadErrorType

/**
 * Pads a {@link Bytes} or {@link Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.padRight(Bytes.from([1]), 4)
 * // Uint8Array([1, 0, 0, 0])
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.padRight('0x1234', 4)
 * // '0x12340000'
 */
export function padRight<value extends Bytes | Hex>(
  value: value,
  size?: number | undefined,
): PadRightReturnType<value> {
  return pad(value, { dir: 'right', size })
}

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

type PadOptions = {
  dir?: 'left' | 'right' | undefined
  size?: number | undefined
}

type PadReturnType<value extends Bytes | Hex> = value extends Hex ? Hex : Bytes

type PadErrorType = PadHexErrorType | PadBytesErrorType | ErrorType

function pad<value extends Bytes | Hex>(
  value: value,
  options: PadOptions = {},
): PadReturnType<value> {
  const { dir, size = 32 } = options
  if (typeof value === 'string')
    return padHex(value, { dir, size }) as PadReturnType<value>
  return padBytes(value, { dir, size }) as PadReturnType<value>
}

type PadHexErrorType = SizeExceedsPaddingSizeErrorType | ErrorType

function padHex(hex_: Hex, options: PadOptions = {}) {
  const { dir, size = 32 } = options

  if (size === 0) return hex_

  const hex = hex_.replace('0x', '')
  if (hex.length > size * 2)
    throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size,
      type: 'hex',
    })

  return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0')}` as Hex
}

type PadBytesErrorType = SizeExceedsPaddingSizeErrorType | ErrorType

function padBytes(bytes: Bytes, options: PadOptions = {}) {
  const { dir, size = 32 } = options
  if (size === 0) return bytes
  if (bytes.length > size)
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size,
      type: 'bytes',
    })
  const paddedBytes = new Uint8Array(size)
  for (let i = 0; i < size; i++) {
    const padEnd = dir === 'right'
    paddedBytes[padEnd ? i : size - i - 1] =
      bytes[padEnd ? i : bytes.length - i - 1]!
  }
  return paddedBytes
}
