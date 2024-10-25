import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'

/**
 * Checks if two {@link ox#Address.Address} are equal.
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
export function isEqual(
  addressA: Address.Address,
  addressB: Address.Address,
): boolean {
  Address.assert(addressA, { strict: false })
  Address.assert(addressB, { strict: false })
  return addressA.toLowerCase() === addressB.toLowerCase()
}

export declare namespace isEqual {
  type ErrorType = Address.assert.ErrorType | Errors.GlobalErrorType
}

isEqual.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Address.isEqual.ErrorType
