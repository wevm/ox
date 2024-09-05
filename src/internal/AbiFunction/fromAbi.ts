import type { Abi } from '../Abi/types.js'
import { AbiItemNotFoundError } from '../AbiItem/errors.js'
import { AbiItem_fromAbi } from '../AbiItem/fromAbi.js'
import type { AbiItem_ExtractArgs } from '../AbiItem/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { AbiFunction, AbiFunction_Name } from './types.js'

/**
 * Extracts an {@link ox#AbiFunction.AbiFunction} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ### Extracting by Name
 *
 * ABI Functions can be extracted by their name using the `name` option:
 *
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiFunction.fromAbi(abi, { name: 'foo' }) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Extracting by Selector
 *
 * ABI Functions can be extract by their selector when {@link Hex.Hex} is provided to `name`.
 *
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiFunction.fromAbi(abi, { name: '0x095ea7b3' }) // [!code focus]
 * //    ^?
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
 * :::note
 *
 * Extracting via a hex selector is useful when extracting an ABI Function from an `eth_call` RPC response or
 * from a Transaction `input`.
 *
 * :::
 *
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function AbiFunction_fromAbi<
  const abi extends Abi | readonly unknown[],
  name extends AbiFunction_Name<abi>,
  const args extends AbiItem_ExtractArgs<abi, name> | undefined = undefined,
>(
  abi: abi | Abi | readonly unknown[],
  options: AbiItem_fromAbi.Options<
    abi,
    name,
    args,
    AbiItem_ExtractArgs<abi, name>,
    AbiFunction_Name<abi>
  >,
): AbiItem_fromAbi.ReturnType<abi, name, args, AbiFunction> {
  const item = AbiItem_fromAbi(abi, options as any)
  if (item.type !== 'function')
    throw new AbiItemNotFoundError({ ...options, type: 'function' })
  return item as never
}

export declare namespace AbiFunction_fromAbi {
  type ErrorType = AbiItem_fromAbi.ErrorType | GlobalErrorType
}

AbiFunction_fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiFunction_fromAbi.ErrorType
