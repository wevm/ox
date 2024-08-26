import type { Address } from '../address/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Address_checksum } from './checksum.js'
import {
  InvalidAddressChecksumError,
  InvalidAddressError,
  InvalidAddressInputError,
} from './errors.js'

const addressRegex = /^0x[a-fA-F0-9]{40}$/

/**
 * Asserts that the given value is a valid address.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 * Address.assert('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
 * // true
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 * Address.assert('0xdeadbeef')
 * // InvalidAddressError: Address "0xdeadbeef" is invalid.
 * ```
 */
export function Address_assert(
  address: string,
  options?: Address_assert.Options | undefined,
): asserts address is Address {
  const { strict = true } = options ?? {}

  if (!addressRegex.test(address))
    throw new InvalidAddressError({
      address,
      cause: new InvalidAddressInputError(),
    })

  if (strict) {
    if (address.toLowerCase() === address) return
    if (Address_checksum(address as Address) !== address)
      throw new InvalidAddressError({
        address,
        cause: new InvalidAddressChecksumError(),
      })
  }
}

export declare namespace Address_assert {
  export type Options = {
    /**
     * Enables strict mode. Whether or not to compare the address against its checksum.
     *
     * @default true
     */
    strict?: boolean | undefined
  }

  export type ErrorType = InvalidAddressError | GlobalErrorType
}

/* v8 ignore next */
Address_assert.parseError = (error: unknown) =>
  error as Address_assert.ErrorType
