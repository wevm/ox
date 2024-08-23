import { toBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import { getSignature } from './getSignature.js'

/**
 * Computes the signature hash for an ABI Item.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 * const hash = Abi.getSignatureHash('event Transfer(address indexed from, address indexed to, uint256 amount)')
 * // '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 * const hash = Abi.getSignatureHash({
 *   name: 'Transfer',
 *   type: 'event',
 *   inputs: [
 *     { name: 'from', type: 'address', indexed: true },
 *     { name: 'to', type: 'address', indexed: true },
 *     { name: 'amount', type: 'uint256', indexed: false },
 *   ],
 * })
 * // '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 */
export function getSignatureHash(abiItem: getSignatureHash.Parameters) {
  return keccak256(toBytes(getSignature(abiItem)))
}

export declare namespace getSignatureHash {
  type Parameters = getSignature.Parameters

  type ErrorType =
    | getSignature.ErrorType
    | keccak256.ErrorType
    | toBytes.ErrorType
    | GlobalErrorType
}

getSignatureHash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getSignatureHash.ErrorType
