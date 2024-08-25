import type { AbiFunction } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { sliceHex } from '../hex/sliceHex.js'
import { getSignatureHash } from './getSignatureHash.js'

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
export const getSelector = (abiItem: string | AbiFunction) =>
  sliceHex(getSignatureHash(abiItem), 0, 4)

export declare namespace getSelector {
  type Parameters = getSignatureHash.Parameters

  type ErrorType =
    | getSignatureHash.ErrorType
    | sliceHex.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
getSelector.parseError = (error: unknown) => error as getSelector.ErrorType
