import { AbiParameters_encode } from '../AbiParameters/encode.js'
import type {
  AbiParameters_ToObject,
  AbiParameters_ToPrimitiveTypes,
} from '../AbiParameters/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { AbiItem_Function } from './types.js'

/**
 * ABI-encodes the provided function output (`outputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const totalSupply = AbiItem.from('function totalSupply() returns (uint256)')
 * const output = AbiItem.decodeFunctionOutput(totalSupply, '0x000000000000000000000000000000000000000000000000000000000000002a')
 * // 42n
 *
 * const data = AbiItem.encodeFunctionOutput(totalSupply, 42n) // [!code focus]
 * // @log: '0x000000000000000000000000000000000000000000000000000000000000002a'
 * ```
 *
 * @param abiItem - The ABI item to encode the function output for.
 * @param output - The function output to encode.
 * @param options - Encoding options.
 * @returns The encoded function output.
 */
export function AbiItem_encodeFunctionOutput<
  const abiItem extends AbiItem_Function,
  as extends 'Object' | 'Array' = 'Array',
>(
  abiItem: abiItem | AbiItem_Function,
  output: AbiItem_encodeFunctionOutput.Output<abiItem, as>,
  options: AbiItem_encodeFunctionOutput.Options<as> = {},
): Hex {
  const { as = 'Array' } = options

  const values = (() => {
    if (abiItem.outputs.length === 1) return [output]
    if (Array.isArray(output)) return output
    if (as === 'Object') return Object.values(output as any)
    return [output]
  })()

  return AbiParameters_encode(abiItem.outputs, values)
}

export declare namespace AbiItem_encodeFunctionOutput {
  type Output<
    abiItem extends AbiItem_Function = AbiItem_Function,
    as extends 'Object' | 'Array' = 'Array',
  > = abiItem['outputs'] extends readonly []
    ? never
    : abiItem['outputs']['length'] extends 1
      ? AbiParameters_ToPrimitiveTypes<abiItem['outputs']>[0]
      : as extends 'Object'
        ? AbiParameters_ToObject<abiItem['outputs']>
        : AbiParameters_ToPrimitiveTypes<abiItem['outputs']>

  type Options<as extends 'Object' | 'Array'> = {
    as?: as | 'Object' | 'Array' | undefined
  }

  type ErrorType = AbiParameters_encode.ErrorType | GlobalErrorType
}
