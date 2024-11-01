import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
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
export function AbiError_getSelector(abiItem: string | AbiError): Hex {
  return AbiItem.getSelector(abiItem)
}

export declare namespace AbiError_getSelector {
  type ErrorType = AbiItem.getSelector.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
AbiError_getSelector.parseError = (error: unknown) =>
  error as AbiError_getSelector.ErrorType
