import type * as Abi from '../../Abi.js'
import type * as AbiEvent from '../../AbiEvent.js'
import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import type { ExtractArgs } from '../AbiItem/types.js'

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
export function fromAbi<
  const abi extends Abi.Abi | readonly unknown[],
  name extends AbiEvent.Name<abi>,
  const args extends ExtractArgs<abi, name> | undefined = undefined,
  //
  allNames = AbiEvent.Name<abi>,
>(
  abi: abi | Abi.Abi | readonly unknown[],
  name: Hex.Hex | (name extends allNames ? name : never),
  options?: AbiItem.fromAbi.Options<abi, name, args, ExtractArgs<abi, name>>,
): AbiItem.fromAbi.ReturnType<abi, name, args, AbiEvent.AbiEvent> {
  const item = AbiItem.fromAbi(abi, name, options as any)
  if (item.type !== 'event')
    throw new AbiItem.NotFoundError({ name, type: 'event' })
  return item as never
}

export declare namespace fromAbi {
  type ErrorType = AbiItem.fromAbi.ErrorType | Errors.GlobalErrorType
}

fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as fromAbi.ErrorType
