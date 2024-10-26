import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

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
export function getSelector(abiItem: string | AbiItem.AbiItem): Hex.Hex {
  return Hex.slice(AbiItem.getSignatureHash(abiItem), 0, 4)
}

export declare namespace getSelector {
  type ErrorType =
    | AbiItem.getSignatureHash.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
getSelector.parseError = (error: unknown) => error as getSelector.ErrorType
