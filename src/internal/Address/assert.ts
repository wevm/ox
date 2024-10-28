import type * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'
import { addressRegex } from '../regex.js'
import { Address_checksum } from './checksum.js'
import {
  Address_InvalidAddressError,
  Address_InvalidChecksumError,
  Address_InvalidInputError,
} from './errors.js'

/**
 * Asserts that the given value is a valid {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.assert('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.assert('0xdeadbeef')
 * // @error: InvalidAddressError: Address "0xdeadbeef" is invalid.
 * ```
 *
 * @param value - Value to assert if it is a valid address.
 * @param options - Assertion options.
 */
export function Address_assert(
  value: string,
  options: Address_assert.Options = {},
): asserts value is Address.Address {
  const { strict = true } = options

  if (!addressRegex.test(value))
    throw new Address_InvalidAddressError({
      address: value,
      cause: new Address_InvalidInputError(),
    })

  if (strict) {
    if (value.toLowerCase() === value) return
    if (Address_checksum(value as Address.Address) !== value)
      throw new Address_InvalidAddressError({
        address: value,
        cause: new Address_InvalidChecksumError(),
      })
  }
}

export declare namespace Address_assert {
  type Options = {
    /**
     * Enables strict mode. Whether or not to compare the address against its checksum.
     *
     * @default true
     */
    strict?: boolean | undefined
  }

  type ErrorType = Address_InvalidAddressError | Errors.GlobalErrorType
}

/* v8 ignore next */
Address_assert.parseError = (error: unknown) =>
  error as Address_assert.ErrorType
