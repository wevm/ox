import type { Address } from 'abitype'

import { assertAddress } from './assert.js'

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
export function isAddressEqual(a: Address, b: Address): boolean {
  assertAddress(a, { strict: false })
  assertAddress(b, { strict: false })
  return a.toLowerCase() === b.toLowerCase()
}
