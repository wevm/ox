import { Address_assert } from './assert.js'
import type { Address } from './types.js'

/**
 * Checks if the given address is a valid {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.validate('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
 * // @log: true
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.validate('0xdeadbeef')
 * // @log: false
 * ```
 *
 * @param address - Value to check if it is a valid address.
 * @param options - Check options.
 * @returns Whether the address is a valid address.
 */
export function Address_validate(
  address: string,
  options: Address_validate.Options = {},
): address is Address {
  const { strict = true } = options ?? {}
  try {
    Address_assert(address, { strict })
    return true
  } catch {
    return false
  }
}

export declare namespace Address_validate {
  interface Options {
    /**
     * Enables strict mode. Whether or not to compare the address against its checksum.
     *
     * @default true
     */
    strict?: boolean | undefined
  }
}
