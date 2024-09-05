import type { Abi } from '../Abi/types.js'
import { AbiItemNotFoundError } from '../AbiItem/errors.js'
import { AbiItem_extract } from '../AbiItem/extract.js'
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
 * const item = AbiFunction.extract(abi, { name: 'foo' }) // [!code focus]
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
 * ### Extracting by Data
 *
 * ABI Functions can be extract by their function selector using the `data` option:
 *
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiFunction.extract(abi, { data: '0x095ea7b3' }) // [!code focus]
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
 * Using the `data` option is useful when extracting an ABI Function from an `eth_call` RPC response or
 * from a Transaction `input`.
 *
 * :::
 *
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function AbiFunction_extract<
  const abi extends Abi | readonly unknown[],
  name extends AbiFunction_Name<abi>,
  const args extends AbiItem_ExtractArgs<abi, name> | undefined = undefined,
>(
  abi: abi | Abi | readonly unknown[],
  options: AbiItem_extract.Options<
    abi,
    name,
    args,
    AbiItem_ExtractArgs<abi, name>,
    AbiFunction_Name<abi>
  >,
): AbiItem_extract.ReturnType<abi, name, args, AbiFunction> {
  const item = AbiItem_extract(abi, options as any)
  if (item.type !== 'function')
    throw new AbiItemNotFoundError({ ...options, type: 'function' })
  return item as never
}

export declare namespace AbiFunction_extract {
  type ErrorType = AbiItem_extract.ErrorType | GlobalErrorType
}

AbiFunction_extract.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiFunction_extract.ErrorType
