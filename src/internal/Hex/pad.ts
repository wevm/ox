import * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'

/**
 * Pads a {@link ox#Hex.Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.padLeft('0x1234', 4)
 * // @log: '0x00001234'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to pad.
 * @param size - The size (in bytes) of the output hex value.
 * @returns The padded {@link ox#Hex.Hex} value.
 */
export function padLeft(value: Hex.Hex, size?: number | undefined): Hex.Hex {
  return pad(value, { dir: 'left', size })
}

export declare namespace padLeft {
  type ErrorType = pad.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
padLeft.parseError = (error: unknown) => error as Hex.padLeft.ErrorType

/**
 * Pads a {@link ox#Hex.Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 *
 * Hex.padRight('0x1234', 4)
 * // @log: '0x12340000'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to pad.
 * @param size - The size (in bytes) of the output hex value.
 * @returns The padded {@link ox#Hex.Hex} value.
 */
export function padRight(value: Hex.Hex, size?: number | undefined): Hex.Hex {
  return pad(value, { dir: 'right', size })
}

export declare namespace padRight {
  type ErrorType = pad.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
padRight.parseError = (error: unknown) => error as Hex.padRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function pad(hex_: Hex.Hex, options: pad.Options = {}) {
  const { dir, size = 32 } = options

  if (size === 0) return hex_

  const hex = hex_.replace('0x', '')
  if (hex.length > size * 2)
    throw new Errors.SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size,
      type: 'Hex',
    })

  return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0')}` as Hex.Hex
}

/** @internal */
export declare namespace pad {
  type Options = {
    dir?: 'left' | 'right' | undefined
    size?: number | undefined
  }
  type ErrorType = Errors.SizeExceedsPaddingSizeError | Errors.GlobalErrorType
}
