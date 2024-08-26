import { Bytes_from } from '../bytes/from.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import type { Hex } from '../hex/types.js'
import { Abi_getSignature } from './getSignature.js'
import type { Abi } from './types.js'

/**
 * Computes the signature hash for an ABI Item.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const hash = Abi.getSignatureHash('event Transfer(address indexed from, address indexed to, uint256 amount)')
 * // '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
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
 *
 * @param abiItem - The ABI Item to compute the signature hash for.
 * @returns The {@link Hash#keccak256} hash of the ABI item's signature.
 */
export function Abi_getSignatureHash(abiItem: string | Abi[number]): Hex {
  return Hash_keccak256(Bytes_from(Abi_getSignature(abiItem)))
}

export declare namespace Abi_getSignatureHash {
  type ErrorType =
    | Abi_getSignature.ErrorType
    | Hash_keccak256.ErrorType
    | Bytes_from.ErrorType
    | GlobalErrorType
}

Abi_getSignatureHash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Abi_getSignatureHash.ErrorType
