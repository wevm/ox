import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import { AbiItem_getSelector } from '../AbiItem/getSelector.js'
import type { AbiFunction } from './types.js'

/**
 * Computes the [4-byte selector](https://solidity-by-example.org/function-selector/) for an {@link ox#AbiFunction.AbiFunction}.
 *
 * Useful for computing function selectors for calldata.
 *
 * @example
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const selector = AbiFunction.getSelector('function ownerOf(uint256 tokenId)')
 * // @log: '0x6352211e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const selector = AbiFunction.getSelector({
 *   inputs: [{ type: 'uint256' }],
 *   name: 'ownerOf',
 *   outputs: [],
 *   stateMutability: 'view',
 *   type: 'function'
 * })
 * // @log: '0x6352211e'
 * ```
 *
 * @param abiItem - The ABI item to compute the selector for.
 * @returns The first 4 bytes of the {@link ox#Hash.(keccak256:function)} hash of the function signature.
 */
export function AbiFunction_getSelector(abiItem: string | AbiFunction): Hex {
  return AbiItem_getSelector(abiItem)
}

export declare namespace AbiFunction_getSelector {
  type ErrorType = AbiItem_getSelector.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
AbiFunction_getSelector.parseError = (error: unknown) =>
  error as AbiFunction_getSelector.ErrorType
