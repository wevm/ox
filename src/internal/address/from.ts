import type { Address } from 'abitype'
import type { GlobalErrorType } from '../errors/error.js'
import { Address_assert } from './assert.js'
import { Address_checksum } from './checksum.js'

/**
 * Converts a stringified address to a typed (checksummed) Address.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
 * // '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 *
 * Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e', { checksum: false })
 * // '0xa0cf798816d4b9b9866b5330eea46a18382f251e'
 *
 * Address.from('hello')
 * // InvalidAddressError: Address "0xa" is invalid.
 * ```
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
  export type Options = {
    checksum?: boolean
  }

  export type ErrorType =
    | Address_assert.ErrorType
    | Address_checksum.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Address_from.parseError = (error: unknown) => error as Address_from.ErrorType
