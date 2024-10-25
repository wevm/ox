import { type Abi, type ParseAbi, parseAbi } from 'abitype'
import type * as Errors from '../../Errors.js'
import type { AbiItem_Signatures } from '../AbiItem/types.js'

/**
 * Parses an arbitrary **JSON ABI** or **Human Readable ABI** into a typed {@link ox#Abi.Abi}.
 *
 * @example
 * ### JSON ABIs
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const abi = Abi.from([{
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
 * abi
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Human Readable ABIs
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const abi = Abi.from([
 *   'function approve(address spender, uint256 amount) returns (bool)'
 * ])
 *
 * abi
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @param abi - The ABI to parse.
 * @returns The typed ABI.
 */
export function from<
  const abi extends Abi | readonly string[] | readonly unknown[],
>(
  abi: (abi | Abi | readonly string[] | readonly unknown[]) &
    (abi extends readonly string[] ? AbiItem_Signatures<abi> : Abi),
): from.ReturnType<abi> {
  if (typeof abi[0] === 'string') return parseAbi(abi as never)
  return abi as never
}

export declare namespace from {
  type ReturnType<abi extends Abi | readonly string[] | readonly unknown[]> =
    abi extends readonly string[] ? ParseAbi<abi> : abi

  type ErrorType = Errors.GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as from.ErrorType
