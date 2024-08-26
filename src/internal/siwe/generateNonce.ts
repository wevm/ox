import { uid } from '../uid.js'

/**
 * Generates random EIP-4361 nonce.
 *
 * - Docs: https://oxlib.sh/api/siwe/generateNonce
 * - Spec: https://eips.ethereum.org/EIPS/eip-4361
 *
 * @example
 * ```ts twoslash
 * import { Siwe } from 'ox'
 *
 * Siwe.generateNonce()
 * // '65ed4681d4efe0270b923ff5f4b097b1c95974dc33aeebecd5724c42fd86dfd25dc70b27ef836b2aa22e68f19ebcccc1'
 * ```
 */
export function Siwe_generateNonce(): string {
  return uid(96)
}
