import type { Abi } from '../Abi/types.js'
import { AbiItem_NotFoundError } from '../AbiItem/errors.js'
import { AbiItem_fromAbi } from '../AbiItem/fromAbi.js'
import type { AbiItem_ExtractArgs } from '../AbiItem/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { AbiEvent, AbiEvent_Name } from './types.js'

/**
 * Extracts an {@link ox#AbiEvent.AbiEvent} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ### Extracting by Name
 *
 * ABI Events can be extracted by their name using the `name` option:
 *
 * ```ts twoslash
 * import { Abi, AbiEvent } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiEvent.fromAbi(abi, 'Transfer') // [!code focus]
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
 * ABI Events can be extract by their selector when {@link ox#Hex.Hex} is provided to `name`.
 *
 * ```ts twoslash
 * import { Abi, AbiEvent } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiEvent.fromAbi(abi, '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') // [!code focus]
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
 * Extracting via a hex selector is useful when extracting an ABI Event from the first topic of a Log.
 *
 * :::
 *
 * @param abi - The ABI to extract from.
 * @param name - The name (or selector) of the ABI item to extract.
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function AbiEvent_fromAbi<
  const abi extends Abi | readonly unknown[],
  name extends AbiEvent_Name<abi>,
  const args extends AbiItem_ExtractArgs<abi, name> | undefined = undefined,
  //
  allNames = AbiEvent_Name<abi>,
>(
  abi: abi | Abi | readonly unknown[],
  name: Hex | (name extends allNames ? name : never),
  options?: AbiItem_fromAbi.Options<
    abi,
    name,
    args,
    AbiItem_ExtractArgs<abi, name>
  >,
): AbiItem_fromAbi.ReturnType<abi, name, args, AbiEvent> {
  const item = AbiItem_fromAbi(abi, name, options as any)
  if (item.type !== 'event')
    throw new AbiItem_NotFoundError({ name, type: 'event' })
  return item as never
}

export declare namespace AbiEvent_fromAbi {
  type ErrorType = AbiItem_fromAbi.ErrorType | GlobalErrorType
}

AbiEvent_fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiEvent_fromAbi.ErrorType
