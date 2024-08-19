import type { Address } from 'abitype'
import { assertAddress } from './assert.js'
import { checksumAddress } from './checksum.js'
import type { GlobalErrorType } from '../errors/error.js'

/**
 * Converts an address string to a typed (checksummed) Address.
 *
 * @example
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
 */
export function toAddress(
  address: string,
  options: toAddress.Options = {},
): Address {
  const { checksum = true } = options
  assertAddress(address)
  if (checksum) return checksumAddress(address)
  return address as Address
}

export declare namespace toAddress {
  export type Options = {
    checksum?: boolean
  }

  export type ErrorType =
    | assertAddress.ErrorType
    | checksumAddress.ErrorType
    | GlobalErrorType
}

toAddress.parseError = (error: unknown) => error as toAddress.ErrorType
