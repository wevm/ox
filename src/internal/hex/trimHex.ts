import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Trims leading zeros from a {@link Types#Hex} value.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.trimLeft('0x00000000deadbeef') // '0xdeadbeef'
 * ```
 */
export function trimLeft(value: Hex): trimLeft.ReturnType {
  return trimHex(value, { dir: 'left' })
}

export declare namespace trimLeft {
  type ReturnType = Hex

  type ErrorType = trimHex.ErrorType | GlobalErrorType
}

/* v8 ignore next */
trimLeft.parseError = (error: unknown) => error as trimLeft.ErrorType

/**
 * Trims trailing zeros from a {@link Types#Hex} value.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.trimRight('0xdeadbeef00000000') // '0xdeadbeef'
 * ```
 */
export function trimRight(value: Hex): trimRight.ReturnType {
  return trimHex(value, { dir: 'right' })
}

export declare namespace trimRight {
  type ReturnType = Hex

  type ErrorType = trimHex.ErrorType | GlobalErrorType
}

/* v8 ignore next */
trimRight.parseError = (error: unknown) => error as trimRight.ErrorType

/** @internal */
export function trimHex(
  value: Hex,
  options: trimHex.Options = {},
): trimHex.ReturnType {
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
  return `0x${data.length % 2 === 1 ? `0${data}` : data}` as trimHex.ReturnType
}

/** @internal */
export declare namespace trimHex {
  type Options = {
    dir?: 'left' | 'right' | undefined
  }

  type ReturnType = Hex

  type ErrorType = GlobalErrorType
}
