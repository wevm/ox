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
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
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
): asserts value is Address {
  const { strict = true } = options

  if (!addressRegex.test(value))
    throw new InvalidAddressError({
      address: value,
      cause: new InvalidAddressInputError(),
    })

  if (strict) {
    if (value.toLowerCase() === value) return
    if (Address_checksum(value as Address) !== value)
      throw new InvalidAddressError({
        address: value,
        cause: new InvalidAddressChecksumError(),
      })
  }
}

export declare namespace Address_assert {
  interface Options {
    /**
     * Enables strict mode. Whether or not to compare the address against its checksum.
     *
     * @default true
     */
    strict?: boolean | undefined
  }

  type ErrorType = InvalidAddressError | GlobalErrorType
}

/* v8 ignore next */
Address_assert.parseError = (error: unknown) =>
  error as Address_assert.ErrorType
