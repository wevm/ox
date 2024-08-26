import { SizeExceedsPaddingSizeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'

/**
 * Pads a {@link Hex#Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.padLeft('0x1234', 4)
 * // '0x00001234'
 * ```
 */
export function Hex_padLeft(
  value: Hex,
  size?: number | undefined,
): Hex_padLeft.ReturnType {
  return pad(value, { dir: 'left', size })
}

export declare namespace Hex_padLeft {
  type ReturnType = Hex
  type ErrorType = pad.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_padLeft.parseError = (error: unknown) => error as Hex_padLeft.ErrorType

/**
 * Pads a {@link Hex#Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.padRight('0x1234', 4)
 * // '0x12340000'
 * ```
 */
export function Hex_padRight(
  value: Hex,
  size?: number | undefined,
): Hex_padRight.ReturnType {
  return pad(value, { dir: 'right', size })
}

export declare namespace Hex_padRight {
  type ReturnType = Hex
  type ErrorType = pad.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_padRight.parseError = (error: unknown) => error as Hex_padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function pad(hex_: Hex, options: pad.Options = {}) {
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
export declare namespace pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }
  type ErrorType = SizeExceedsPaddingSizeError | GlobalErrorType
}
