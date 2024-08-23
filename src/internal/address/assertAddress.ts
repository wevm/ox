import type { Address } from 'abitype'
import {
  InvalidAddressChecksumError,
  InvalidAddressError,
  InvalidAddressInputError,
} from '../errors/address.js'
import type { GlobalErrorType } from '../errors/error.js'
import { checksumAddress } from './checksumAddress.js'

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
 *
 * @alias ox!Address.assertAddress:function(1)
 */
export function assertAddress(
  address: string,
  options?: assertAddress.Options | undefined,
): asserts address is Address {
  const { strict = true } = options ?? {}

  if (!addressRegex.test(address))
    throw new InvalidAddressError({
      address,
      cause: new InvalidAddressInputError(),
    })

  if (strict) {
    if (address.toLowerCase() === address) return
    if (checksumAddress(address as Address) !== address)
      throw new InvalidAddressError({
        address,
        cause: new InvalidAddressChecksumError(),
      })
  }
}

export declare namespace assertAddress {
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
assertAddress.parseError = (error: unknown) => error as assertAddress.ErrorType
