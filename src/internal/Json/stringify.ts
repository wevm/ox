import type { Errors } from '../../Errors.js'

const bigIntSuffix = '#__bigint'

/**
 * Stringifies a value to its JSON representation, with support for `bigint`.
 *
 * @example
 * ```ts twoslash
 * import { Json } from 'ox'
 *
 * const json = Json.stringify({
 *   foo: 'bar',
 *   baz: 69420694206942069420694206942069420694206942069420n,
 * })
 * // @log: '{"foo":"bar","baz":"69420694206942069420694206942069420694206942069420#__bigint"}'
 * ```
 *
 * @param value - The value to stringify.
 * @param replacer - A function that transforms the results. It is passed the key and value of the property, and must return the value to be used in the JSON string. If this function returns `undefined`, the property is not included in the resulting JSON string.
 * @param space - A string or number that determines the indentation of the JSON string. If it is a number, it indicates the number of spaces to use as indentation; if it is a string (e.g. `'\t'`), it uses the string as the indentation character.
 * @returns The JSON string.
 */
export function Json_stringify(
  value: any,
  replacer?: ((this: any, key: string, value: any) => any) | null | undefined,
  space?: string | number | undefined,
) {
  return JSON.stringify(
    value,
    (key, value) => {
      if (typeof replacer === 'function') return replacer(key, value)
      if (typeof value === 'bigint') return value.toString() + bigIntSuffix
      return value
    },
    space,
  )
}

export declare namespace Json_stringify {
  type ErrorType = Errors.GlobalErrorType
}

Json_stringify.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Json_stringify.ErrorType
