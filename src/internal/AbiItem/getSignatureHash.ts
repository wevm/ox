import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import * as Hash from '../../Hash.js'
import * as Hex from '../../Hex.js'

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
export function getSignatureHash(abiItem: string | AbiItem.AbiItem): Hex.Hex {
  if (typeof abiItem !== 'string' && 'hash' in abiItem && abiItem.hash)
    return abiItem.hash as Hex.Hex
  return Hash.keccak256(Hex.fromString(AbiItem.getSignature(abiItem)))
}

export declare namespace getSignatureHash {
  type ErrorType =
    | AbiItem.getSignature.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

getSignatureHash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getSignatureHash.ErrorType
