import type { Errors } from '../../Errors.js'
import { AbiItem_InvalidSelectorSizeError } from '../AbiItem/errors.js'
import { AbiParameters_decode } from '../AbiParameters/decode.js'
import type { AbiParameters_ToPrimitiveTypes } from '../AbiParameters/types.js'
import { Hex_size } from '../Hex/size.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import { AbiFunction_fromAbi } from './fromAbi.js'
import type { AbiFunction } from './types.js'

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
export function AbiFunction_decodeData<const abiItem extends AbiFunction>(
  abiFunction: abiItem | AbiFunction,
  data: Hex,
): AbiFunction_decodeData.ReturnType<abiItem> {
  const { overloads } = abiFunction

  if (Hex_size(data) < 4) throw new AbiItem_InvalidSelectorSizeError({ data })
  if (abiFunction.inputs.length === 0) return undefined

  const item = overloads
    ? AbiFunction_fromAbi([abiFunction, ...overloads], data as never)
    : abiFunction

  if (Hex_size(data) <= 4) return undefined
  return AbiParameters_decode(item.inputs, Hex_slice(data, 4))
}

export declare namespace AbiFunction_decodeData {
  type ReturnType<abiFunction extends AbiFunction = AbiFunction> = IsNarrowable<
    abiFunction,
    AbiFunction
  > extends true
    ? abiFunction['inputs'] extends readonly []
      ? undefined
      :
          | AbiParameters_ToPrimitiveTypes<abiFunction['inputs']>
          | (abiFunction['overloads'] extends readonly AbiFunction[]
              ? AbiParameters_ToPrimitiveTypes<
                  abiFunction['overloads'][number]['inputs']
                >
              : never)
    : unknown

  type ErrorType =
    | AbiFunction_fromAbi.ErrorType
    | AbiParameters_decode.ErrorType
    | Hex_size.ErrorType
    | Hex_slice.ErrorType
    | Errors.GlobalErrorType
}
