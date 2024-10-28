import type { Errors } from '../../Errors.js'
import { AbiParameters_encode } from '../AbiParameters/encode.js'
import type {
  AbiParameters_ToObject,
  AbiParameters_ToPrimitiveTypes,
} from '../AbiParameters/types.js'
import type { Hex } from '../Hex/types.js'
import type { AbiFunction } from './types.js'

/**
 * ABI-encodes a function's result (`outputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const totalSupply = AbiFunction.from('function totalSupply() returns (uint256)')
 * const output = AbiFunction.decodeResult(totalSupply, '0x000000000000000000000000000000000000000000000000000000000000002a')
 * // 42n
 *
 * const data = AbiFunction.encodeResult(totalSupply, 42n) // [!code focus]
 * // @log: '0x000000000000000000000000000000000000000000000000000000000000002a'
 * ```
 *
 * @param abiFunction - The ABI item to encode the function output for.
 * @param output - The function output to encode.
 * @param options - Encoding options.
 * @returns The encoded function output.
 */
export function AbiFunction_encodeResult<
  const abiFunction extends AbiFunction,
  as extends 'Object' | 'Array' = 'Array',
>(
  abiFunction: abiFunction | AbiFunction,
  output: AbiFunction_encodeResult.Output<abiFunction, as>,
  options: AbiFunction_encodeResult.Options<as> = {},
): Hex {
  const { as = 'Array' } = options

  const values = (() => {
    if (abiFunction.outputs.length === 1) return [output]
    if (Array.isArray(output)) return output
    if (as === 'Object') return Object.values(output as any)
    return [output]
  })()

  return AbiParameters_encode(abiFunction.outputs, values)
}

export declare namespace AbiFunction_encodeResult {
  type Output<
    abiFunction extends AbiFunction = AbiFunction,
    as extends 'Object' | 'Array' = 'Array',
  > = abiFunction['outputs'] extends readonly []
    ? never
    : abiFunction['outputs']['length'] extends 1
      ? AbiParameters_ToPrimitiveTypes<abiFunction['outputs']>[0]
      : as extends 'Object'
        ? AbiParameters_ToObject<abiFunction['outputs']>
        : AbiParameters_ToPrimitiveTypes<abiFunction['outputs']>

  type Options<as extends 'Object' | 'Array'> = {
    as?: as | 'Object' | 'Array' | undefined
  }

  type ErrorType = AbiParameters_encode.ErrorType | Errors.GlobalErrorType
}
