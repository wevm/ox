import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Trims leading zeros from a {@link Hex#Hex} value.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.trimLeft('0x00000000deadbeef') // '0xdeadbeef'
 * ```
 */
export function Hex_trimLeft(value: Hex): Hex_trimLeft.ReturnType {
  return trim(value, { dir: 'left' })
}

export declare namespace Hex_trimLeft {
  type ReturnType = Hex

  type ErrorType = trim.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_trimLeft.parseError = (error: unknown) => error as Hex_trimLeft.ErrorType

/**
 * Trims trailing zeros from a {@link Hex#Hex} value.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.trimRight('0xdeadbeef00000000') // '0xdeadbeef'
 * ```
 */
export function Hex_trimRight(value: Hex): Hex_trimRight.ReturnType {
  return trim(value, { dir: 'right' })
}

export declare namespace Hex_trimRight {
  type ReturnType = Hex

  type ErrorType = trim.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_trimRight.parseError = (error: unknown) => error as Hex_trimRight.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function trim(value: Hex, options: trim.Options = {}): trim.ReturnType {
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

  type ReturnType = Hex

  type ErrorType = GlobalErrorType
}
