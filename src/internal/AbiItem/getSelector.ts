import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import { AbiItem_getSignatureHash } from './getSignatureHash.js'
import type { AbiItem } from './types.js'

/**
 * Computes the [4-byte selector](https://solidity-by-example.org/function-selector/) for an {@link ox#AbiItem.AbiItem}.
 *
 * Useful for computing function selectors for calldata.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const selector = AbiItem.getSelector('function ownerOf(uint256 tokenId)')
 * // @log: '0x6352211e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const selector = AbiItem.getSelector({
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
 * @returns The first 4 bytes of the {@link ox#Hash.(keccak256:function)} hash of the function signature.
 */
export function AbiItem_getSelector(abiItem: string | AbiItem): Hex {
  return Hex_slice(AbiItem_getSignatureHash(abiItem), 0, 4)
}

export declare namespace AbiItem_getSelector {
  type ErrorType =
    | AbiItem_getSignatureHash.ErrorType
    | Hex_slice.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
AbiItem_getSelector.parseError = (error: unknown) =>
  error as AbiItem_getSelector.ErrorType
