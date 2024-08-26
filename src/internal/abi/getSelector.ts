import type { AbiFunction } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { Hex_slice } from '../hex/slice.js'
import { Abi_getSignatureHash } from './getSignatureHash.js'

/**
 * Computes the selector for an ABI Item.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 * const selector = Abi.getSelector('function ownerOf(uint256 tokenId)')
 * // '0x6352211e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 * const selector = Abi.getSelector({
 *   inputs: [{ type: 'uint256' }],
 *   name: 'ownerOf',
 *   outputs: [],
 *   stateMutability: 'view',
 *   type: 'function'
 * })
 * // '0x6352211e'
 * ```
 */
export const Abi_getSelector = (abiItem: string | AbiFunction) =>
  Hex_slice(Abi_getSignatureHash(abiItem), 0, 4)

export declare namespace Abi_getSelector {
  type Parameters = Abi_getSignatureHash.Parameters

  type ErrorType =
    | Abi_getSignatureHash.ErrorType
    | Hex_slice.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Abi_getSelector.parseError = (error: unknown) =>
  error as Abi_getSelector.ErrorType
