import type { Abi } from '../Abi/types.js'
import { AbiItemNotFoundError } from '../AbiItem/errors.js'
import { AbiItem_fromAbi } from '../AbiItem/fromAbi.js'
import type { AbiItem_ExtractArgs } from '../AbiItem/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { AbiError, AbiError_Name } from './types.js'

/**
 * Extracts an {@link ox#AbiError.AbiError} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ### Extracting by Name
 *
 * ABI Errors can be extracted by their name using the `name` option:
 *
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'error BadSignatureV(uint8 v)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiError.fromAbi(abi, { name: 'BadSignatureV' }) // [!code focus]
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
 * ABI Errors can be extract by their selector when {@link Hex.Hex} is provided to `name`.
 *
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'error BadSignatureV(uint8 v)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiError.fromAbi(abi, { name: '0x095ea7b3' }) // [!code focus]
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
 * Extracting via a hex selector is useful when extracting an ABI Error from JSON-RPC error data.
 *
 * :::
 *
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function AbiError_fromAbi<
  const abi extends Abi | readonly unknown[],
  name extends AbiError_Name<abi>,
  const args extends AbiItem_ExtractArgs<abi, name> | undefined = undefined,
>(
  abi: abi | Abi | readonly unknown[],
  options: AbiItem_fromAbi.Options<
    abi,
    name,
    args,
    AbiItem_ExtractArgs<abi, name>,
    AbiError_Name<abi>
  >,
): AbiItem_fromAbi.ReturnType<abi, name, args, AbiError> {
  const item = AbiItem_fromAbi(abi, options as any)
  if (item.type !== 'error')
    throw new AbiItemNotFoundError({ ...options, type: 'error' })
  return item as never
}

export declare namespace AbiError_fromAbi {
  type ErrorType = AbiItem_fromAbi.ErrorType | GlobalErrorType
}

AbiError_fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiError_fromAbi.ErrorType
