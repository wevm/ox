import type { GlobalErrorType } from '../errors/error.js'
import { Address_assert } from './assert.js'
import type { Address } from './types.js'

/**
 * Checks if two addresses are equal.
 *
 * @example
 * ```ts
 * import { Address } from 'ox'
 *
 * const isEqual = Address.isEqual(
 *   '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
 *   '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * )
 * // true
 *
 * const isEqual = Address.isEqual(
 *   '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
 *   '0xA0Cf798816D4b9b9866b5330EEa46a18382f251f'
 * )
 * // false
 * ```
 */
export function Address_isEqual(a: Address, b: Address): boolean {
  Address_assert(a, { strict: false })
  Address_assert(b, { strict: false })
  return a.toLowerCase() === b.toLowerCase()
}

export declare namespace Address_isEqual {
  type ErrorType = Address_assert.ErrorType | GlobalErrorType
}

Address_isEqual.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Address_isEqual.ErrorType
