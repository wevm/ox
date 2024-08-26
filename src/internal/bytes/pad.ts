import { SizeExceedsPaddingSizeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Pads a {@link Types#Bytes} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.padLeft(Bytes.from([1]), 4)
 * // Uint8Array([0, 0, 0, 1])
 * ```
 */
export function Bytes_padLeft(
  value: Bytes,
  size?: number | undefined,
): Bytes_padLeft.ReturnType {
  return pad(value, { dir: 'left', size })
}

export declare namespace Bytes_padLeft {
  type ReturnType = pad.ReturnType
  type ErrorType = pad.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bytes_padLeft.parseError = (error: unknown) => error as Bytes_padLeft.ErrorType

/**
 * Pads a {@link Types#Bytes} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.padRight(Bytes.from([1]), 4)
 * // Uint8Array([1, 0, 0, 0])
 * ```
 */
export function Bytes_padRight(
  value: Bytes,
  size?: number | undefined,
): Bytes_padRight.ReturnType {
  return pad(value, { dir: 'right', size })
}

export declare namespace Bytes_padRight {
  type ReturnType = pad.ReturnType
  type ErrorType = pad.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bytes_padRight.parseError = (error: unknown) =>
  error as Bytes_padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function pad(bytes: Bytes, options: pad.Options = {}) {
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

/** @internal */
export declare namespace pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }

  type ReturnType = Bytes

  type ErrorType = SizeExceedsPaddingSizeError | GlobalErrorType
}
