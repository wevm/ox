import * as Address from '../../Address.js'
import * as Bytes from '../../Bytes.js'
import * as Caches from '../../Caches.js'
import type * as Errors from '../../Errors.js'
import * as Hash from '../../Hash.js'

/**
 * Computes the checksum address for the given {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.checksum('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
 * // @log: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * ```
 *
 * @param address - The address to compute the checksum for.
 * @returns The checksummed address.
 */
export function checksum(address: string): Address.Address {
  if (Caches.checksum.has(address)) return Caches.checksum.get(address)!

  Address.assert(address, { strict: false })

  const hexAddress = address.substring(2).toLowerCase()
  const hash = Hash.keccak256(Bytes.fromString(hexAddress), { as: 'Bytes' })

  const characters = hexAddress.split('')
  for (let i = 0; i < 40; i += 2) {
    if (hash[i >> 1]! >> 4 >= 8 && characters[i]) {
      characters[i] = characters[i]!.toUpperCase()
    }
    if ((hash[i >> 1]! & 0x0f) >= 8 && characters[i + 1]) {
      characters[i + 1] = characters[i + 1]!.toUpperCase()
    }
  }

  const result = `0x${characters.join('')}` as const
  Caches.checksum.set(address, result)
  return result
}

export declare namespace checksum {
  type ErrorType =
    | Address.assert.ErrorType
    | Hash.keccak256.ErrorType
    | Bytes.fromString.ErrorType
    | Errors.GlobalErrorType
}

checksum.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as checksum.ErrorType
