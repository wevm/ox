import type { Address } from 'abitype'
import type { GlobalErrorType } from '../errors/error.js'
import { assertAddress } from './assertAddress.js'
import { checksumAddress } from './checksumAddress.js'

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
 *
 * @alias ox!Address.toAddress:function(1)
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

/* v8 ignore next */
toAddress.parseError = (error: unknown) => error as toAddress.ErrorType
