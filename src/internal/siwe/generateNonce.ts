import { uid } from '../uid.js'

/**
 * Generates random [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) nonce.
 *
 * @example
 * ```ts twoslash
 * import { Siwe } from 'ox'
 *
 * Siwe.generateNonce()
 * // @log: '65ed4681d4efe0270b923ff5f4b097b1c95974dc33aeebecd5724c42fd86dfd25dc70b27ef836b2aa22e68f19ebcccc1'
 * ```
 *
 * @returns Random nonce.
 */
export function Siwe_generateNonce(): string {
  return uid(96)
}
