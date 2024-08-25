import { SizeExceedsPaddingSizeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Pads a {@link Types#Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.padLeft('0x1234', 4)
 * // '0x00001234'
 * ```
 */
export function padLeft(
  value: Hex,
  size?: number | undefined,
): padLeft.ReturnType {
  return padHex(value, { dir: 'left', size })
}

export declare namespace padLeft {
  type ReturnType = Hex
  type ErrorType = padHex.ErrorType | GlobalErrorType
}

/* v8 ignore next */
padLeft.parseError = (error: unknown) => error as padLeft.ErrorType

/**
 * Pads a {@link Types#Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.padRight('0x1234', 4)
 * // '0x12340000'
 * ```
 */
export function padRight(
  value: Hex,
  size?: number | undefined,
): padRight.ReturnType {
  return padHex(value, { dir: 'right', size })
}

export declare namespace padRight {
  type ReturnType = Hex
  type ErrorType = padHex.ErrorType | GlobalErrorType
}

/* v8 ignore next */
padRight.parseError = (error: unknown) => error as padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function padHex(hex_: Hex, options: padHex.Options = {}) {
  const { dir, size = 32 } = options

  if (size === 0) return hex_

  const hex = hex_.replace('0x', '')
  if (hex.length > size * 2)
    throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size,
      type: 'Hex',
    })

  return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0')}` as Hex
}

/** @internal */
export declare namespace padHex {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }
  type ErrorType = SizeExceedsPaddingSizeError | GlobalErrorType
}
