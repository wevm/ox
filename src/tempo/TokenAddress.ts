import * as Address from '../core/Address.js'
import * as TempoAddress from './TempoAddress.js'

export const prefix = '0x20c000000000000000000000'

/**
 * Returns whether an address is a TIP-20 token address.
 *
 * [TIP-20 Token Standard](https://docs.tempo.xyz/protocol/tip20/overview)
 *
 * @example
 * ```ts twoslash
 * import { TokenAddress } from 'ox/tempo'
 *
 * const isTip20 = TokenAddress.isTip20('0x20c0000000000000000000000000000000000001')
 * // @log: true
 * ```
 *
 * @param address - Address to check.
 * @returns Whether the address is a TIP-20 token address.
 */
export function isTip20(address: TempoAddress.Address): boolean {
  const resolved = TempoAddress.resolve(address)
  Address.assert(resolved, { strict: false })
  return resolved.toLowerCase().startsWith(prefix)
}

export declare namespace isTip20 {
  type ErrorType = Address.assert.ErrorType | TempoAddress.parse.ErrorType
}
