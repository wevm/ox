import { type Abi, type ParseAbi, parseAbi } from 'abitype'
import type { AbiItem_Signatures } from '../AbiItem/types.js'
import type { GlobalErrorType } from '../Errors/error.js'

/**
 * Parses an arbitrary **JSON ABI** or **Human Readable ABI** into a typed {@link Abi#Abi}.
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
export function Abi_from<
  const abi extends Abi | readonly string[] | readonly unknown[],
>(
  abi: (abi | Abi | readonly string[] | readonly unknown[]) &
    (abi extends readonly string[] ? AbiItem_Signatures<abi> : Abi),
): Abi_from.ReturnType<abi> {
  if (typeof abi[0] === 'string') return parseAbi(abi as never)
  return abi as never
}

export declare namespace Abi_from {
  type ReturnType<abi extends Abi | readonly string[] | readonly unknown[]> =
    abi extends readonly string[] ? ParseAbi<abi> : abi

  type ErrorType = GlobalErrorType
}

/** v8 ignore next */
Abi_from.parseError = (error: unknown) => error as Abi_from.ErrorType
