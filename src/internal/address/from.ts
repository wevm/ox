import type { GlobalErrorType } from '../errors/error.js'
import { Address_assert } from './assert.js'
import { Address_checksum } from './checksum.js'
import type { Address } from './types.js'

/**
 * Converts a stringified address to a typed (checksummed) {@link Address#Address}.
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
export function Address_from(
  address: string,
  options: Address_from.Options = {},
): Address {
  const { checksum = true } = options
  Address_assert(address)
  if (checksum) return Address_checksum(address)
  return address as Address
}

export declare namespace Address_from {
  interface Options {
    /**
     * Whether to checksum the address.
     *
     * @default true
     */
    checksum?: boolean | undefined
  }

  type ErrorType =
    | Address_assert.ErrorType
    | Address_checksum.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Address_from.parseError = (error: unknown) => error as Address_from.ErrorType
