import { type Abi, type FormatAbi, formatAbi } from 'abitype'
import type { Errors } from '../../Errors.js'

/**
 * Formats an {@link ox#Abi.Abi} into a **Human Readable ABI**.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const formatted = Abi.format([{
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * }])
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param abi - The ABI to format.
 * @returns The formatted ABI.
 */
export function Abi_format<const abi extends Abi | readonly unknown[]>(
  abi: abi | Abi | readonly unknown[],
): FormatAbi<abi> {
  return formatAbi(abi) as never
}

export declare namespace Abi_format {
  type ErrorType = Errors.GlobalErrorType
}

Abi_format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Abi_format.ErrorType
