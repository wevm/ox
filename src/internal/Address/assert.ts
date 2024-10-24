import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'
import { addressRegex } from '../regex.js'

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
export function assert(
  value: string,
  options: Address.assert.Options = {},
): asserts value is Address.Address {
  const { strict = true } = options

  if (!addressRegex.test(value))
    throw new Address.InvalidAddressError({
      address: value,
      cause: new Address.InvalidInputError(),
    })

  if (strict) {
    if (value.toLowerCase() === value) return
    if (Address.checksum(value as Address.Address) !== value)
      throw new Address.InvalidAddressError({
        address: value,
        cause: new Address.InvalidChecksumError(),
      })
  }
}

export declare namespace assert {
  interface Options {
    /**
     * Enables strict mode. Whether or not to compare the address against its checksum.
     *
     * @default true
     */
    strict?: boolean | undefined
  }

  type ErrorType = Address.InvalidAddressError | Errors.GlobalErrorType
}

/* v8 ignore next */
assert.parseError = (error: unknown) => error as assert.ErrorType
