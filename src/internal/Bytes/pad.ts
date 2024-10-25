import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/**
 * Pads a {@link ox#Bytes.Bytes} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.padLeft(Bytes.from([1]), 4)
 * // @log: Uint8Array([0, 0, 0, 1])
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} value to pad.
 * @param size - Size to pad the {@link ox#Bytes.Bytes} value to.
 * @returns Padded {@link ox#Bytes.Bytes} value.
 */
export function padLeft(
  value: Bytes.Bytes,
  size?: number | undefined,
): Bytes.padLeft.ReturnType {
  return pad(value, { dir: 'left', size })
}

export declare namespace padLeft {
  type ReturnType = pad.ReturnType
  type ErrorType = pad.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
padLeft.parseError = (error: unknown) => error as Bytes.padLeft.ErrorType

/**
 * Pads a {@link ox#Bytes.Bytes} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.padRight(Bytes.from([1]), 4)
 * // @log: Uint8Array([1, 0, 0, 0])
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} value to pad.
 * @param size - Size to pad the {@link ox#Bytes.Bytes} value to.
 * @returns Padded {@link ox#Bytes.Bytes} value.
 */
export function padRight(
  value: Bytes.Bytes,
  size?: number | undefined,
): Bytes.padRight.ReturnType {
  return pad(value, { dir: 'right', size })
}

export declare namespace padRight {
  type ReturnType = pad.ReturnType
  type ErrorType = pad.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
padRight.parseError = (error: unknown) => error as Bytes.padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function pad(bytes: Bytes.Bytes, options: pad.Options = {}) {
  const { dir, size = 32 } = options
  if (size === 0) return bytes
  if (bytes.length > size)
    throw new Bytes.SizeExceedsPaddingSizeError({
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

export declare namespace pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }

  type ReturnType = Bytes.Bytes

  type ErrorType = Bytes.SizeExceedsPaddingSizeError | Errors.GlobalErrorType
}
