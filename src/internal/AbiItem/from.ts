import { type ParseAbiItem, parseAbiItem } from 'abitype'
import type {
  AbiItem,
  AbiItem_Signature,
  AbiItem_Signatures,
} from '../AbiItem/types.js'
import type { GlobalErrorType } from '../Errors/error.js'

/**
 * Parses an arbitrary **JSON ABI Item** or **Human Readable ABI Item** into a typed {@link AbiItem#AbiItem}.
 *
 * @example
 * ### JSON ABIs
 *
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.from({
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
 * })
 *
 * abiItem
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
 * ```
 *
 * @example
 * ### Human Readable ABIs
 *
 * A Human Readable ABI can be parsed into a typed ABI object:
 *
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.from(
 *   'function approve(address spender, uint256 amount) returns (bool)' // [!code hl]
 * )
 *
 * abiItem
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
 * ```
 *
 * @example
 * It is possible to specify `struct`s along with your definitions:
 *
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.from([
 *   'struct Foo { address spender; uint256 amount; }', // [!code hl]
 *   'function approve(Foo foo) returns (bool)',
 * ])
 *
 * abiItem
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
 * ```
 *
 *
 *
 * @param abiItem - The ABI Item to parse.
 * @returns The typed ABI Item.
 */
export function AbiItem_from<
  const abiItem extends AbiItem | string | readonly string[],
>(
  abiItem: (abiItem | AbiItem | string | readonly string[]) &
    (
      | (abiItem extends string ? AbiItem_Signature<abiItem> : never)
      | (abiItem extends readonly string[]
          ? AbiItem_Signatures<abiItem>
          : never)
      | AbiItem
    ),
): AbiItem_from.ReturnType<abiItem> {
  if (Array.isArray(abiItem)) return parseAbiItem(abiItem as never)
  if (typeof abiItem === 'string') return parseAbiItem(abiItem as never)
  return abiItem as never
}

export declare namespace AbiItem_from {
  type ReturnType<abiItem extends AbiItem | string | readonly string[]> =
    abiItem extends string
      ? ParseAbiItem<abiItem>
      : abiItem extends readonly string[]
        ? ParseAbiItem<abiItem>
        : abiItem

  type ErrorType = GlobalErrorType
}

AbiItem_from.parseError = (error: unknown) =>
  /** v8 ignore next */
  error as AbiItem_from.ErrorType
