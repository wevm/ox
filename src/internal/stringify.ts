import type { GlobalErrorType } from './Errors/error.js'

/**
 * @internal
 *
 * Stringifies a value to its JSON representation with support for `bigint` and `function`.
 */
export const stringify: typeof JSON.stringify = (value, replacer, space) =>
  JSON.stringify(
    value,
    (key, value_) => {
      const value = typeof value_ === 'bigint' ? value_.toString() : value_
      return typeof replacer === 'function' ? replacer(key, value) : value
    },
    space,
  )

/** @internal */
export declare namespace stringify {
  type ErrorType = GlobalErrorType
}
