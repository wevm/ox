import type { GlobalErrorType } from '../Errors/error.js'
import { keccak256 } from '../Hash/keccak256.js'
import { Hex_fromString } from '../Hex/fromString.js'
import type { Hex } from '../Hex/types.js'
import { AbiItem_getSignature } from './getSignature.js'
import type { AbiItem } from './types.js'

/**
 * Computes the signature hash for an {@link ox#AbiItem.AbiItem}.
 *
 * Useful for computing Event Topic values.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const hash = AbiItem.getSignatureHash('event Transfer(address indexed from, address indexed to, uint256 amount)')
 * // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const hash = AbiItem.getSignatureHash({
 *   name: 'Transfer',
 *   type: 'event',
 *   inputs: [
 *     { name: 'from', type: 'address', indexed: true },
 *     { name: 'to', type: 'address', indexed: true },
 *     { name: 'amount', type: 'uint256', indexed: false },
 *   ],
 * })
 * // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 *
 * @param abiItem - The ABI Item to compute the signature hash for.
 * @returns The {@link ox#Hash.(keccak256:function)} hash of the ABI item's signature.
 */
export function AbiItem_getSignatureHash(abiItem: string | AbiItem): Hex {
  if (typeof abiItem !== 'string' && 'hash' in abiItem && abiItem.hash)
    return abiItem.hash as Hex
  return keccak256(Hex_fromString(AbiItem_getSignature(abiItem)))
}

export declare namespace AbiItem_getSignatureHash {
  type ErrorType =
    | AbiItem_getSignature.ErrorType
    | keccak256.ErrorType
    | Hex_fromString.ErrorType
    | GlobalErrorType
}

AbiItem_getSignatureHash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiItem_getSignatureHash.ErrorType
