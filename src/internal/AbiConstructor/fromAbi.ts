import type * as Abi from '../../Abi.js'
import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import type { IsNarrowable } from '../types.js'
import type { AbiConstructor } from './types.js'

/**
 * Extracts an {@link ox#AbiConstructor.AbiConstructor} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ### Extracting by Name
 *
 * ABI Events can be extracted by their name using the `name` option:
 *
 * ```ts twoslash
 * import { Abi, AbiConstructor } from 'ox'
 *
 * const abi = Abi.from([
 *   'constructor(address owner)',
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiConstructor.fromAbi(abi) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @returns The ABI constructor.
 */
export function AbiConstructor_fromAbi<
  const abi extends Abi.Abi | readonly unknown[],
>(
  abi: abi | Abi.Abi | readonly unknown[],
): AbiConstructor_fromAbi.ReturnType<abi> {
  const item = (abi as Abi.Abi).find((item) => item.type === 'constructor')
  if (!item) throw new AbiItem.NotFoundError({ name: 'constructor' })
  return item
}

export declare namespace AbiConstructor_fromAbi {
  type ReturnType<abi extends Abi.Abi | readonly unknown[]> = IsNarrowable<
    abi,
    Abi.Abi
  > extends true
    ? Extract<abi[number], { type: 'constructor' }>
    : AbiConstructor

  type ErrorType = AbiItem.NotFoundError | Errors.GlobalErrorType
}

AbiConstructor_fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor_fromAbi.ErrorType
