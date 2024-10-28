import type { Errors } from '../../Errors.js'

const bigIntSuffix = '#__bigint'

/**
 * Parses a JSON string, with support for `bigint`.
 *
 * @example
 * ```ts twoslash
 * import { Json } from 'ox'
 *
 * const json = Json.parse('{"foo":"bar","baz":"69420694206942069420694206942069420694206942069420#__bigint"}')
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
  return JSON.parse(string, (key, value_) => {
    const value = value_
    if (typeof value === 'string' && value.endsWith(bigIntSuffix))
      return BigInt(value.slice(0, -bigIntSuffix.length))
    return typeof reviver === 'function' ? reviver(key, value) : value
  })
}

export declare namespace Json_parse {
  type ErrorType = Errors.GlobalErrorType
}

Json_parse.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Json_parse.ErrorType
