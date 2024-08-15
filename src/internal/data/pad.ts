import {
  SizeExceedsPaddingSizeError,
  type SizeExceedsPaddingSizeErrorType,
} from '../errors/data.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

export declare namespace padLeft {
  type ReturnType<value extends Bytes | Hex> = pad.ReturnType<value>
  type ErrorType = pad.ErrorType | ErrorType_
}

/**
 * Pads a {@link Bytes} or {@link Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/padLeft
 * - Docs (Hex): https://oxlib.sh/api/hex/padLeft
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
): padLeft.ReturnType<value> {
  return pad(value, { dir: 'left', size })
}

export declare namespace padRight {
  type ReturnType<value extends Bytes | Hex> = pad.ReturnType<value>
  type ErrorType = pad.ErrorType | ErrorType_
}

/**
 * Pads a {@link Bytes} or {@link Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/padRight
 * - Docs (Hex): https://oxlib.sh/api/hex/padRight
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
): padRight.ReturnType<value> {
  return pad(value, { dir: 'right', size })
}

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

export declare namespace pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }

  type ReturnType<value extends Bytes | Hex> = value extends Hex ? Hex : Bytes

  type ErrorType = padHex.ErrorType | padBytes.ErrorType | ErrorType_
}
function pad<value extends Bytes | Hex>(
  value: value,
  options: pad.Options = {},
): pad.ReturnType<value> {
  const { dir, size = 32 } = options
  if (typeof value === 'string')
    return padHex(value, { dir, size }) as pad.ReturnType<value>
  return padBytes(value, { dir, size }) as pad.ReturnType<value>
}

export declare namespace padHex {
  type Options = pad.Options
  type ErrorType = SizeExceedsPaddingSizeErrorType | ErrorType_
}
function padHex(hex_: Hex, options: padHex.Options = {}) {
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

export declare namespace padBytes {
  type Options = pad.Options
  type ErrorType = SizeExceedsPaddingSizeErrorType | ErrorType_
}
function padBytes(bytes: Bytes, options: padBytes.Options = {}) {
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
