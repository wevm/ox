import { type ParseAbi, parseAbi } from 'abitype'

import type * as Abi from '../../Abi.js'
import type * as Errors from '../../Errors.js'
import type { Signatures } from '../AbiItem/types.js'

export function from<const abi extends Abi.Abi | readonly string[]>(
  abi: abi & (abi extends readonly string[] ? Signatures<abi> : unknown),
): Abi.from.ReturnType<abi>

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
export function from(abi: Abi.Abi | readonly string[]): Abi.from.ReturnType {
  if (isSignatures(abi)) return parseAbi(abi)
  return abi
}

export declare namespace from {
  type ReturnType<
    abi extends Abi.Abi | readonly string[] | readonly unknown[] = Abi.Abi,
  > = abi extends readonly string[] ? ParseAbi<abi> : abi

  type ErrorType = Errors.GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Abi.from.ErrorType

/** @internal */
function isSignatures(
  value: Abi.Abi | readonly string[],
): value is readonly string[] {
  for (const item of value) {
    if (typeof item !== 'string') return false
  }
  return true
}
