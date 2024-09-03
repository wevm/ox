import type { Bytes } from '../bytes/types.js'
import { SizeExceedsPaddingSizeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'

/**
 * Pads a {@link Bytes#Bytes} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.padLeft(Bytes.from([1]), 4)
 * // @log: Uint8Array([0, 0, 0, 1])
 * ```
 *
 * @param value - {@link Bytes#Bytes} value to pad.
 * @param size - Size to pad the {@link Bytes#Bytes} value to.
 * @returns Padded {@link Bytes#Bytes} value.
 */
export function Bytes_padLeft(
  value: Bytes,
  size?: number | undefined,
): Bytes_padLeft.ReturnType {
  return Bytes_pad(value, { dir: 'left', size })
}

export declare namespace Bytes_padLeft {
  type ReturnType = Bytes_pad.ReturnType
  type ErrorType = Bytes_pad.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bytes_padLeft.parseError = (error: unknown) => error as Bytes_padLeft.ErrorType

/**
 * Pads a {@link Bytes#Bytes} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.padRight(Bytes.from([1]), 4)
 * // @log: Uint8Array([1, 0, 0, 0])
 * ```
 *
 * @param value - {@link Bytes#Bytes} value to pad.
 * @param size - Size to pad the {@link Bytes#Bytes} value to.
 * @returns Padded {@link Bytes#Bytes} value.
 */
export function Bytes_padRight(
  value: Bytes,
  size?: number | undefined,
): Bytes_padRight.ReturnType {
  return Bytes_pad(value, { dir: 'right', size })
}

export declare namespace Bytes_padRight {
  type ReturnType = Bytes_pad.ReturnType
  type ErrorType = Bytes_pad.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bytes_padRight.parseError = (error: unknown) =>
  error as Bytes_padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

export function Bytes_pad(bytes: Bytes, options: Bytes_pad.Options = {}) {
  const { dir, size = 32 } = options
  if (size === 0) return bytes
  if (bytes.length > size)
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size,
      type: 'Bytes',
    })
  const paddedBytes = new Uint8Array(size)
  for (let i = 0; i < size; i++) {
    const padEnd = dir === 'right'
    paddedBytes[padEnd ? i : size - i - 1] =
      bytes[padEnd ? i : bytes.length - i - 1]!
  }
  return paddedBytes
}

export declare namespace Bytes_pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }

  type ReturnType = Bytes

  type ErrorType = SizeExceedsPaddingSizeError | GlobalErrorType
}
