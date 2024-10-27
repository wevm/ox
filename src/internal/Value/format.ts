import type * as Errors from '../../Errors.js'

/**
 * Formats a `bigint` Value to its string representation (divided by the given exponent).
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.format(420_000_000_000n, 9)
 * // @log: '420'
 * ```
 *
 * @param value - The `bigint` Value to format.
 * @param decimals - The exponent to divide the `bigint` Value by.
 * @returns The string representation of the Value.
 */
export function Value_format(value: bigint, decimals = 0) {
  let display = value.toString()

  const negative = display.startsWith('-')
  if (negative) display = display.slice(1)

  display = display.padStart(decimals, '0')

  let [integer, fraction] = [
    display.slice(0, display.length - decimals),
    display.slice(display.length - decimals),
  ]
  fraction = fraction.replace(/(0+)$/, '')
  return `${negative ? '-' : ''}${integer || '0'}${
    fraction ? `.${fraction}` : ''
  }`
}

export declare namespace Value_format {
  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
Value_format.parseError = (error: unknown) => error as Value_format.ErrorType
