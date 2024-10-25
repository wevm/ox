import { AbiItem_getSelector } from '../AbiItem/getSelector.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { AbiError } from './types.js'

/**
 * Computes the [4-byte selector](https://solidity-by-example.org/function-selector/) for an {@link ox#AbiError.AbiError}.
 *
 * @example
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const selector = AbiError.getSelector('error BadSignatureV(uint8 v)')
 * // @log: '0x6352211e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const selector = AbiError.getSelector({
 *   inputs: [{ name: 'v', type: 'uint8' }],
 *   name: 'BadSignatureV',
 *   type: 'error'
 * })
 * // @log: '0x6352211e'
 * ```
 *
 * @param abiItem - The ABI item to compute the selector for.
 * @returns The first 4 bytes of the {@link ox#Hash.(keccak256:function)} hash of the error signature.
 */
export function getSelector(abiItem: string | AbiError): Hex {
  return AbiItem_getSelector(abiItem)
}

export declare namespace getSelector {
  type ErrorType = AbiItem_getSelector.ErrorType | GlobalErrorType
}

/* v8 ignore next */
getSelector.parseError = (error: unknown) => error as getSelector.ErrorType
