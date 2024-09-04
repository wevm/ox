import type { AbiParameter, AbiParameterToPrimitiveType } from 'abitype'
import { AbiParameters_decode } from '../AbiParameters/decode.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import type { AbiItem_Function } from './types.js'

export function AbiItem_decodeFunctionOutput<
  const abiItem extends AbiItem_Function,
  as extends 'Object' | 'Array' = 'Array',
>(
  abiItem: abiItem | AbiItem_Function,
  data: Hex,
  options?: AbiItem_decodeFunctionOutput.Options<as>,
): AbiItem_decodeFunctionOutput.ReturnType<abiItem, as>

/**
 * ABI-decodes the given data according to the ABI Item's output types (`outputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const data = '0x18160ddd000000000000000000000000000000000000000000000000000000000000002a'
 *
 * const totalSupply = AbiItem.from('function totalSupply() returns (uint256)')
 *
 * const output = AbiItem.decodeFunctionOutput(totalSupply, data)
 * // @log: 42n
 * ```
 *
 * @example
 * You can extract an ABI Function from a JSON ABI with {@link ox#AbiItem.extract}:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiItem } from 'ox'
 *
 * const data = '0x18160ddd000000000000000000000000000000000000000000000000000000000000002a'
 *
 * const erc20Abi = Abi.from([...]) // [!code hl]
 * const totalSupply = AbiItem.extract(erc20Abi, { name: 'totalSupply' }) // [!code hl]
 *
 * const output = AbiItem.decodeFunctionOutput(totalSupply, data)
 * ```
 *
 * @example
 * If the function name is not known in advance, you can use the `data` to infer and extract the function:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiItem } from 'ox'
 *
 * const data = '0x18160ddd000000000000000000000000000000000000000000000000000000000000002a'
 *
 * const erc20Abi = Abi.from([...]) // [!code hl]
 * const fn = AbiItem.extract(erc20Abi, { data }) // [!code hl]
 *
 * const output = AbiItem.decodeFunctionOutput(fn, data)
 * ```
 *
 * :::note
 *
 * The caveat to this example is that the `output` is not strongly-typed.
 *
 * :::
 *
 * @param abiItem - ABI Function to decode
 * @param data - ABI-encoded function output
 * @returns Decoded function output
 */
export function AbiItem_decodeFunctionOutput(
  abiItem: AbiItem_Function,
  data: Hex,
  options?: {
    /**
     * Whether the decoded values should be returned as an `Object` or `Array`.
     *
     * @default "Array"
     */
    as?: 'Array' | 'Object' | undefined
  },
): unknown
export function AbiItem_decodeFunctionOutput(
  abiItem: AbiItem_Function,
  data: Hex,
  options: {
    /**
     * Whether the decoded values should be returned as an `Object` or `Array`.
     *
     * @default "Array"
     */
    as?: 'Array' | 'Object' | undefined
  } = {},
): unknown {
  const values = AbiParameters_decode(abiItem.outputs, data, options)
  if (values && Object.keys(values).length === 0) return undefined
  if (values && Object.keys(values).length === 1) {
    if (Array.isArray(values)) return values[0]
    return Object.values(values)[0]
  }
  return values
}

export declare namespace AbiItem_decodeFunctionOutput {
  type Options<as extends 'Object' | 'Array'> = {
    /**
     * Whether the decoded values should be returned as an `Object` or `Array`.
     *
     * @default "Array"
     */
    as?: as | 'Array' | 'Object' | undefined
  }

  type ReturnType<
    abiItem extends AbiItem_Function,
    as extends 'Object' | 'Array',
  > = IsNarrowable<abiItem, AbiItem_Function> extends true
    ? abiItem['outputs'] extends readonly []
      ? undefined
      : abiItem['outputs'] extends readonly [infer type extends AbiParameter]
        ? AbiParameterToPrimitiveType<type>
        : AbiParameters_decode.ReturnType<abiItem['outputs'], as>
    : unknown

  type ErrorType = GlobalErrorType
}
