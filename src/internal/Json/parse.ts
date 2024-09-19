import type { GlobalErrorType } from '../Errors/error.js'

const bigIntRegex = /(-?\d+)n/g
const bigIntSuffix = '#__ox_bi__'

/**
 * Parses a JSON string, with support for `bigint`.
 *
 * @example
 * ```ts twoslash
 * import { Json } from 'ox'
 *
 * const json = Json.parse('{"foo":"bar","baz":69420694206942069420694206942069420694206942069420}')
 * // @log: {
 * // @log:   foo: 'bar',
 * // @log:   baz: 69420694206942069420694206942069420694206942069420n
 * // @log: }
 * ```
 *
 * @param string - The value to parse.
 * @param reviver - A function that transforms the results.
 * @returns The parsed value.
 */
export function Json_parse(
  string: string,
  reviver?: ((this: any, key: string, value: any) => any) | undefined,
) {
  const string_ = string.replace(bigIntRegex, '"$1#__ox_bi__"')

  const value = JSON.parse(string_, (key, value_) => {
    const value = value_
    if (typeof value === 'string' && value.endsWith(bigIntSuffix))
      return BigInt(value.slice(0, -bigIntSuffix.length))
    return typeof reviver === 'function' ? reviver(key, value) : value
  })
  return value
}

export declare namespace Json_parse {
  type ErrorType = GlobalErrorType
}

Json_parse.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Json_parse.ErrorType
