import { AbiParameters_decode } from '../AbiParameters/decode.js'
import type { AbiParameters_ToPrimitiveTypes } from '../AbiParameters/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_size } from '../Hex/size.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import { AbiItem_extract } from './extract.js'
import type { AbiItem_Function } from './types.js'

export function AbiItem_decodeFunctionInput<
  const abiItem extends AbiItem_Function,
>(
  abiItem: abiItem | AbiItem_Function,
  data: Hex,
): AbiItem_decodeFunctionInput.ReturnType<abiItem>

/**
 * ABI-decodes input data according to the ABI Item's input types (`inputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const approve = AbiItem.from('function approve(address, uint256)')
 *
 * const data = AbiItem.encodeFunctionInput(
 *   approve,
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * )
 * // '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 *
 * const input = AbiItem.decodeFunctionInput(approve, data) // [!code focus]
 * // @log: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * ```
 *
 * @param abiItem - The ABI Item to decode.
 * @param data - The data to decode.
 */
export function AbiItem_decodeFunctionInput(
  abiItem: AbiItem_Function,
  data: Hex,
): unknown

// eslint-disable-next-line jsdoc/require-jsdoc
export function AbiItem_decodeFunctionInput(
  abiItem: AbiItem_Function,
  data: Hex,
): unknown {
  const { overloads } = abiItem

  const item = overloads
    ? (AbiItem_extract([abiItem as AbiItem_Function, ...overloads], {
        data,
      }) as AbiItem_Function)
    : abiItem

  if (Hex_size(data) <= 4) return undefined
  return AbiParameters_decode(item.inputs, Hex_slice(data, 4))
}

export declare namespace AbiItem_decodeFunctionInput {
  type ReturnType<abiItem extends AbiItem_Function = AbiItem_Function> =
    IsNarrowable<abiItem, AbiItem_Function> extends true
      ? abiItem['inputs'] extends readonly []
        ? undefined
        :
            | AbiParameters_ToPrimitiveTypes<abiItem['inputs']>
            | (abiItem['overloads'] extends readonly AbiItem_Function[]
                ? AbiParameters_ToPrimitiveTypes<
                    abiItem['overloads'][number]['inputs']
                  >
                : never)
      : unknown

  type ErrorType =
    | AbiItem_extract.ErrorType
    | AbiParameters_decode.ErrorType
    | Hex_size.ErrorType
    | Hex_slice.ErrorType
    | GlobalErrorType
}
