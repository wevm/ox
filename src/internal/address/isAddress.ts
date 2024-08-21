import type { Address } from 'abitype'
import { assertAddress } from './assertAddress.js'

/**
 * Checks if the given address is a valid address.
 *
 * @example
 * ```ts
 * import { Address } from 'ox'
 *
 * Address.isAddress('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
 * // true
 *
 * Address.isAddress('0xdeadbeef')
 * // false
 * ```
 */
export function isAddress(
  address: string,
  options?: isAddress.Options | undefined,
): address is Address {
  const { strict = true } = options ?? {}
  try {
    assertAddress(address, { strict })
    return true
  } catch {
    return false
  }
}

export declare namespace isAddress {
  export type Options = assertAddress.Options
}
