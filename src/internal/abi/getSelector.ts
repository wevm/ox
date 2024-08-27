import type { AbiFunction } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { Hex_slice } from '../hex/slice.js'
import type { Hex } from '../hex/types.js'
import { Abi_getSignatureHash } from './getSignatureHash.js'

/**
 * Computes the [4-byte selector](https://solidity-by-example.org/function-selector/) for an {@link Abi#Item}.
 *
 * Useful for computing function selectors for calldata.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const selector = Abi.getSelector('function ownerOf(uint256 tokenId)')
 * // @log: '0x6352211e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const selector = Abi.getSelector({
 *   inputs: [{ type: 'uint256' }],
 *   name: 'ownerOf',
 *   outputs: [],
 *   stateMutability: 'view',
 *   type: 'function'
 * })
 * // @log: '0x6352211e'
 * ```
 *
 * @param abiItem - The ABI item to compute the selector for. Can be a signature or an ABI item for an error, event, function, etc.
 * @returns The first 4 bytes of the {@link Hash#keccak256} hash of the function signature.
 */
export function Abi_getSelector(abiItem: string | AbiFunction): Hex {
  return Hex_slice(Abi_getSignatureHash(abiItem), 0, 4)
}

export declare namespace Abi_getSelector {
  type ErrorType =
    | Abi_getSignatureHash.ErrorType
    | Hex_slice.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Abi_getSelector.parseError = (error: unknown) =>
  error as Abi_getSelector.ErrorType
