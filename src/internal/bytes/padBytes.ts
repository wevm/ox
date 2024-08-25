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
export function padLeft(
  value: Bytes,
  size?: number | undefined,
): padLeft.ReturnType {
  return padBytes(value, { dir: 'left', size })
}

export declare namespace padLeft {
  type ReturnType = padBytes.ReturnType
  type ErrorType = padBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
padLeft.parseError = (error: unknown) => error as padLeft.ErrorType

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
export function padRight(
  value: Bytes,
  size?: number | undefined,
): padRight.ReturnType {
  return padBytes(value, { dir: 'right', size })
}

export declare namespace padRight {
  type ReturnType = padBytes.ReturnType
  type ErrorType = padBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
padRight.parseError = (error: unknown) => error as padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function padBytes(bytes: Bytes, options: padBytes.Options = {}) {
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
export declare namespace padBytes {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }

  type ReturnType = Bytes

  type ErrorType = SizeExceedsPaddingSizeError | GlobalErrorType
}
