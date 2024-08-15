import type { ErrorType as ErrorType_ } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'

export declare namespace trimLeft {
  type ReturnType<value extends Bytes | Hex> = value extends Hex ? Hex : Bytes

  type ErrorType = trim.ErrorType | ErrorType_
}

/**
 * Trims leading zeros from a {@link Bytes} or {@link Hex} value.
 *
 * @example
 * import { Data } from 'ox'
 * Data.trimLeft('0x00000000deadbeef') // '0xdeadbeef'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.trimLeft('0x00000000deadbeef') // '0xdeadbeef'
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.trimLeft(Bytes.from([0, 0, 0, 0, 1, 2, 3])) // Uint8Array([1, 2, 3])
 */
export function trimLeft<value extends Bytes | Hex>(
  value: value,
): trimLeft.ReturnType<value> {
  return trim(value, { dir: 'left' })
}

export declare namespace trimRight {
  export type ReturnType<value extends Bytes | Hex> = value extends Hex
    ? Hex
    : Bytes

  export type ErrorType = trim.ErrorType | ErrorType_
}

/**
 * Trims trailing zeros from a {@link Bytes} or {@link Hex} value.
 *
 * @example
 * import { Data } from 'ox'
 * Data.trimRight('0xdeadbeef00000000') // '0xdeadbeef'
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.trimRight('0xdeadbeef00000000') // '0xdeadbeef'
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.trimRight(Bytes.from([1, 2, 3, 0, 0, 0, 0])) // Uint8Array([1, 2, 3])
 */
export function trimRight<value extends Bytes | Hex>(
  value: value,
): trimRight.ReturnType<value> {
  return trim(value, { dir: 'right' })
}

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

export declare namespace trim {
  type Options = {
    dir?: 'left' | 'right' | undefined
  }

  type ReturnType<value extends Bytes | Hex> = value extends Hex ? Hex : Bytes

  type ErrorType = ErrorType_
}
function trim<value extends Bytes | Hex>(
  value: value,
  options: trim.Options = {},
): trim.ReturnType<value> {
  const { dir = 'left' } = options

  let data: any = typeof value === 'string' ? value.replace('0x', '') : value

  let sliceLength = 0
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === 'left' ? i : data.length - i - 1].toString() === '0')
      sliceLength++
    else break
  }
  data =
    dir === 'left'
      ? data.slice(sliceLength)
      : data.slice(0, data.length - sliceLength)

  if (typeof value === 'string') {
    if (data.length === 1 && dir === 'right') data = `${data}0`
    return `0x${data.length % 2 === 1 ? `0${data}` : data}` as trim.ReturnType<value>
  }
  return data as trim.ReturnType<value>
}
