import type { GlobalErrorType } from '../Errors/error.js'
import { Address_assert } from './assert.js'
import type { Address } from './types.js'

/**
 * Checks if two {@link Address#Address} are equal.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.isEqual(
 *   '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
 *   '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * )
 * // @log: true
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.isEqual(
 *   '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
 *   '0xA0Cf798816D4b9b9866b5330EEa46a18382f251f'
 * )
 * // @log: false
 * ```
 *
 * @param addressA - The first address to compare.
 * @param addressB - The second address to compare.
 * @returns Whether the addresses are equal.
 */
export function Address_isEqual(addressA: Address, addressB: Address): boolean {
  Address_assert(addressA, { strict: false })
  Address_assert(addressB, { strict: false })
  return addressA.toLowerCase() === addressB.toLowerCase()
}

export declare namespace Address_isEqual {
  type ErrorType = Address_assert.ErrorType | GlobalErrorType
}

Address_isEqual.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Address_isEqual.ErrorType
