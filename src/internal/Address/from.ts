import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'

/**
 * Converts a stringified address to a typed (checksummed) {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
 * // @log: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e', {
 *   checksum: false
 * })
 * // @log: '0xa0cf798816d4b9b9866b5330eea46a18382f251e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('hello')
 * // @error: InvalidAddressError: Address "0xa" is invalid.
 * ```
 *
 * @param address - An address string to convert to a typed Address.
 * @param options - Conversion options.
 * @returns The typed Address.
 */
export function from(
  address: string,
  options: Address.from.Options = {},
): Address.Address {
  const { checksum = false } = options
  Address.assert(address)
  if (checksum) return Address.checksum(address)
  return address as Address.Address
}

export declare namespace from {
  interface Options {
    /**
     * Whether to checksum the address.
     *
     * @default false
     */
    checksum?: boolean | undefined
  }

  type ErrorType =
    | Address.assert.ErrorType
    | Address.checksum.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
from.parseError = (error: unknown) => error as Address.from.ErrorType
