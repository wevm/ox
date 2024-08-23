import type { Address } from 'abitype'

import { stringToBytes } from '../bytes/toBytes.js'
import * as Caches from '../caches.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import { assertAddress } from './assertAddress.js'

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
export function checksumAddress(address_: string): Address {
  if (Caches.checksum.has(address_)) return Caches.checksum.get(address_)!

  assertAddress(address_, { strict: false })

  const hexAddress = address_.substring(2).toLowerCase()
  const hash = keccak256(stringToBytes(hexAddress), 'Bytes')

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
  Caches.checksum.set(address_, result)
  return result
}

export declare namespace checksumAddress {
  export type ErrorType =
    | assertAddress.ErrorType
    | keccak256.ErrorType
    | stringToBytes.ErrorType
    | GlobalErrorType
}

checksumAddress.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as checksumAddress.ErrorType
