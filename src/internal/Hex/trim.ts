import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'

/**
 * Trims leading zeros from a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.trimLeft('0x00000000deadbeef')
 * // @log: '0xdeadbeef'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to trim.
 * @returns The trimmed {@link ox#Hex.Hex} value.
 */
export function trimLeft(value: Hex.Hex): Hex.trimLeft.ReturnType {
  return trim(value, { dir: 'left' })
}

export declare namespace trimLeft {
  type ReturnType = Hex.Hex

  type ErrorType = trim.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
trimLeft.parseError = (error: unknown) => error as Hex.trimLeft.ErrorType

/**
 * Trims trailing zeros from a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.trimRight('0xdeadbeef00000000')
 * // @log: '0xdeadbeef'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to trim.
 * @returns The trimmed {@link ox#Hex.Hex} value.
 */
export function trimRight(value: Hex.Hex): Hex.trimRight.ReturnType {
  return trim(value, { dir: 'right' })
}

export declare namespace trimRight {
  type ReturnType = Hex.Hex

  type ErrorType = trim.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
trimRight.parseError = (error: unknown) => error as Hex.trimRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function trim(
  value: Hex.Hex,
  options: trim.Options = {},
): trim.ReturnType {
  const { dir = 'left' } = options

  let data = value.replace('0x', '')

  let sliceLength = 0
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === 'left' ? i : data.length - i - 1]!.toString() === '0')
      sliceLength++
    else break
  }
  data =
    dir === 'left'
      ? data.slice(sliceLength)
      : data.slice(0, data.length - sliceLength)

  if (data.length === 1 && dir === 'right') data = `${data}0`
  return `0x${data.length % 2 === 1 ? `0${data}` : data}` as trim.ReturnType
}

/** @internal */
export declare namespace trim {
  type Options = {
    dir?: 'left' | 'right' | undefined
  }

  type ReturnType = Hex.Hex

  type ErrorType = Errors.GlobalErrorType
}
