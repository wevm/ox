import type * as Errors from '../../Errors.js'
import * as Value from '../../Value.js'

/**
 * Parses a `string` representation of a Value to `bigint` (multiplied by the given exponent).
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.from('420', 9)
 * // @log: 420000000000n
 * ```
 *
 * @param value - The string representation of the Value.
 * @param decimals - The exponent to multiply the Value by.
 * @returns The `bigint` representation of the Value.
 */
export function from(value: string, decimals = 0) {
  if (!/^(-?)([0-9]*)\.?([0-9]*)$/.test(value))
    throw new Value.InvalidDecimalNumberError({ value })

  let [integer = '', fraction = '0'] = value.split('.')

  const negative = integer.startsWith('-')
  if (negative) integer = integer.slice(1)

  // trim trailing zeros.
  fraction = fraction.replace(/(0+)$/, '')

  // round off if the fraction is larger than the number of decimals.
  if (decimals === 0) {
    if (Math.round(Number(`.${fraction}`)) === 1)
      integer = `${BigInt(integer) + 1n}`
    fraction = ''
  } else if (fraction.length > decimals) {
    const [left, unit, right] = [
      fraction.slice(0, decimals - 1),
      fraction.slice(decimals - 1, decimals),
      fraction.slice(decimals),
    ]

    const rounded = Math.round(Number(`${unit}.${right}`))
    if (rounded > 9)
      fraction = `${BigInt(left) + BigInt(1)}0`.padStart(left.length + 1, '0')
    else fraction = `${left}${rounded}`

    if (fraction.length > decimals) {
      fraction = fraction.slice(1)
      integer = `${BigInt(integer) + 1n}`
    }

    fraction = fraction.slice(0, decimals)
  } else {
    fraction = fraction.padEnd(decimals, '0')
  }

  return BigInt(`${negative ? '-' : ''}${integer}${fraction}`)
}

export declare namespace from {
  type ErrorType = Value.InvalidDecimalNumberError | Errors.GlobalErrorType
}

/* v8 ignore next */
from.parseError = (error: unknown) => error as from.ErrorType
