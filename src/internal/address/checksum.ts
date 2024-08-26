import { Bytes_fromString } from '../bytes/from.js'
import { Caches_checksum } from '../caches.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import { Address_assert } from './assert.js'
import type { Address } from './types.js'

/**
 * Computes the checksum address for the given address.
 *
 * @example
 * ```ts
 * import { Address } from 'ox'
 *
 * Address.checksum('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
 * // '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * ```
 */
export function Address_checksum(address_: string): Address {
  if (Caches_checksum.has(address_)) return Caches_checksum.get(address_)!

  Address_assert(address_, { strict: false })

  const hexAddress = address_.substring(2).toLowerCase()
  const hash = Hash_keccak256(Bytes_fromString(hexAddress), 'Bytes')

  const address = hexAddress.split('')
  for (let i = 0; i < 40; i += 2) {
    if (hash[i >> 1]! >> 4 >= 8 && address[i]) {
      address[i] = address[i]!.toUpperCase()
    }
    if ((hash[i >> 1]! & 0x0f) >= 8 && address[i + 1]) {
      address[i + 1] = address[i + 1]!.toUpperCase()
    }
  }

  const result = `0x${address.join('')}` as const
  Caches_checksum.set(address_, result)
  return result
}

export declare namespace Address_checksum {
  export type ErrorType =
    | Address_assert.ErrorType
    | Hash_keccak256.ErrorType
    | Bytes_fromString.ErrorType
    | GlobalErrorType
}

Address_checksum.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Address_checksum.ErrorType
