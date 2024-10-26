import { type FormatAbi, formatAbi } from 'abitype'

import type * as Abi from '../../Abi.js'
import type * as Errors from '../../Errors.js'

export function format<const abi extends Abi.Abi>(
  abi: abi,
): Abi.format.ReturnType<abi>

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
export function format(
  abi: Abi.Abi | readonly unknown[],
): Abi.format.ReturnType {
  return formatAbi(abi)
}

export declare namespace format {
  type ReturnType<abi extends Abi.Abi | readonly unknown[] = Abi.Abi> =
    FormatAbi<abi>

  type ErrorType = Errors.GlobalErrorType
}

format.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Abi.format.ErrorType
