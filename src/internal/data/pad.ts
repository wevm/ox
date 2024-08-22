import { SizeExceedsPaddingSizeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Pads a {@link Types#Bytes} or {@link Types#Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/padLeft
 * - Docs (Hex): https://oxlib.sh/api/hex/padLeft
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.padLeft(Bytes.from([1]), 4)
 * // Uint8Array([0, 0, 0, 1])
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.padLeft('0x1234', 4)
 * // '0x00001234'
 * ```
 */
export function padLeft<value extends Bytes | Hex>(
  value: value,
  size?: number | undefined,
): padLeft.ReturnType<value> {
  return pad(value, { dir: 'left', size })
}

export declare namespace padLeft {
  type ReturnType<value extends Bytes | Hex> = pad.ReturnType<value>
  type ErrorType = pad.ErrorType | GlobalErrorType
}

padLeft.parseError = (error: unknown) => error as padLeft.ErrorType

/**
 * Pads a {@link Types#Bytes} or {@link Types#Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/padRight
 * - Docs (Hex): https://oxlib.sh/api/hex/padRight
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.padRight(Bytes.from([1]), 4)
 * // Uint8Array([1, 0, 0, 0])
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.padRight('0x1234', 4)
 * // '0x12340000'
 * ```
 */
export function padRight<value extends Bytes | Hex>(
  value: value,
  size?: number | undefined,
): padRight.ReturnType<value> {
  return pad(value, { dir: 'right', size })
}

export declare namespace padRight {
  type ReturnType<value extends Bytes | Hex> = pad.ReturnType<value>
  type ErrorType = pad.ErrorType | GlobalErrorType
}

padRight.parseError = (error: unknown) => error as padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

export function pad<value extends Bytes | Hex>(
  value: value,
  options: pad.Options = {},
): pad.ReturnType<value> {
  const { dir, size = 32 } = options
  if (typeof value === 'string')
    return padHex(value, { dir, size }) as pad.ReturnType<value>
  return padBytes(value, { dir, size }) as pad.ReturnType<value>
}

export declare namespace pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }

  type ReturnType<value extends Bytes | Hex> = value extends Hex ? Hex : Bytes

  type ErrorType = padHex.ErrorType | padBytes.ErrorType | GlobalErrorType
}

export function padHex(hex_: Hex, options: padHex.Options = {}) {
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

export declare namespace padHex {
  type Options = pad.Options
  type ErrorType = SizeExceedsPaddingSizeError | GlobalErrorType
}

export function padBytes(bytes: Bytes, options: padBytes.Options = {}) {
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

export declare namespace padBytes {
  type Options = pad.Options
  type ErrorType = SizeExceedsPaddingSizeError | GlobalErrorType
}
