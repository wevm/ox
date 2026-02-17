import type * as Errors from './Errors.js'

const bigIntSuffix = '#__bigint'

/**
 * Serializes a value to a canonical JSON string as defined by
 * [RFC 8785 (JSON Canonicalization Scheme)](https://www.rfc-editor.org/rfc/rfc8785).
 *
 * - Object keys are sorted recursively by UTF-16 code unit comparison.
 * - Primitives are serialized per ECMAScript rules (no trailing zeros on numbers, etc.).
 * - No whitespace is inserted.
 *
 * @example
 * ```ts twoslash
 * import { Json } from 'ox'
 *
 * const json = Json.canonicalize({ b: 2, a: 1 })
 * // @log: '{"a":1,"b":2}'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Json } from 'ox'
 *
 * const json = Json.canonicalize({ z: [3, { y: 1, x: 2 }], a: 'hello' })
 * // @log: '{"a":"hello","z":[3,{"x":2,"y":1}]}'
 * ```
 *
 * @param value - The value to canonicalize.
 * @returns The canonical JSON string.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError('Cannot canonicalize non-finite number')
    return Object.is(value, -0) ? '0' : JSON.stringify(value)
  }
  if (typeof value === 'bigint')
    throw new TypeError('Cannot canonicalize bigint')
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalize(item)).join(',')}]`
  if (typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<string[]>((acc, key) => {
        const v = (value as Record<string, unknown>)[key]
        if (v !== undefined)
          acc.push(`${JSON.stringify(key)}:${canonicalize(v)}`)
        return acc
      }, [])
    return `{${entries.join(',')}}`
  }
  return undefined as never
}

export declare namespace canonicalize {
  type ErrorType = Errors.GlobalErrorType
}

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
export function parse(
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

export declare namespace parse {
  type ErrorType = Errors.GlobalErrorType
}

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
export function stringify(
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

export declare namespace stringify {
  type ErrorType = Errors.GlobalErrorType
}
