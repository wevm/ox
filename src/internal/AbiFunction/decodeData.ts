import * as AbiFunction from '../../AbiFunction.js'
import * as AbiItem from '../../AbiItem.js'
import * as AbiParameters from '../../AbiParameters.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type { ToPrimitiveTypes } from '../AbiParameters/types.js'
import type { IsNarrowable } from '../types.js'

/**
 * ABI-decodes function arguments according to the ABI Item's input types (`inputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const approve = AbiFunction.from('function approve(address, uint256)')
 *
 * const data = AbiFunction.encodeData(
 *   approve,
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * )
 * // '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 *
 * const input = AbiFunction.decodeData(approve, data) // [!code focus]
 * // @log: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * ```
 *
 * @param abiFunction - The ABI Item to decode.
 * @param data - The data to decode.
 */
export function decodeData<const abiItem extends AbiFunction.AbiFunction>(
  abiFunction: abiItem | AbiFunction.AbiFunction,
  data: Hex.Hex,
): decodeData.ReturnType<abiItem> {
  const { overloads } = abiFunction

  if (Hex.size(data) < 4) throw new AbiItem.InvalidSelectorSizeError({ data })
  if (abiFunction.inputs.length === 0) return undefined

  const item = overloads
    ? AbiFunction.fromAbi([abiFunction, ...overloads], data as never)
    : abiFunction

  if (Hex.size(data) <= 4) return undefined
  return AbiParameters.decode(item.inputs, Hex.slice(data, 4))
}

export declare namespace decodeData {
  type ReturnType<
    abiFunction extends AbiFunction.AbiFunction = AbiFunction.AbiFunction,
  > = IsNarrowable<abiFunction, AbiFunction.AbiFunction> extends true
    ? abiFunction['inputs'] extends readonly []
      ? undefined
      :
          | ToPrimitiveTypes<abiFunction['inputs']>
          | (abiFunction['overloads'] extends readonly AbiFunction.AbiFunction[]
              ? ToPrimitiveTypes<abiFunction['overloads'][number]['inputs']>
              : never)
    : unknown

  type ErrorType =
    | AbiFunction.fromAbi.ErrorType
    | AbiParameters.decode.ErrorType
    | Hex.size.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}
