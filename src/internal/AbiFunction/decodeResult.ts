import type { AbiParameter, AbiParameterToPrimitiveType } from 'abitype'
import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import { AbiParameters_decode } from '../AbiParameters/decode.js'
import type { IsNarrowable } from '../types.js'
import type { AbiFunction } from './types.js'

/**
 * ABI-decodes a function's result according to the ABI Item's output types (`outputs`).
 *
 * :::tip
 *
 * This function is typically used to decode contract function return values (e.g. the response of an `eth_call` or the `input` property of a Transaction).
 *
 * See the [End-to-end Example](#end-to-end).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const data = '0x000000000000000000000000000000000000000000000000000000000000002a'
 *
 * const totalSupply = AbiFunction.from('function totalSupply() returns (uint256)')
 *
 * const output = AbiFunction.decodeResult(totalSupply, data)
 * // @log: 42n
 * ```
 *
 * @example
 * You can extract an ABI Function from a JSON ABI with {@link ox#AbiFunction.(fromAbi:function)}:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const data = '0x000000000000000000000000000000000000000000000000000000000000002a'
 *
 * const erc20Abi = Abi.from([...]) // [!code hl]
 * const totalSupply = AbiFunction.fromAbi(erc20Abi, 'totalSupply') // [!code hl]
 *
 * const output = AbiFunction.decodeResult(totalSupply, data)
 * // @log: 42n
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `AbiFunction.decodeResult` to decode the result of a `balanceOf` contract call on the [Wagmi Mint Example contract](https://etherscan.io/address/0xfba3912ca04dd458c843e2ee08967fc04f3579c2).
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { Abi, AbiFunction } from 'ox'
 *
 * // 1. Extract the Function from the Contract's ABI.
 * const abi = Abi.from([
 *   // ...
 *   {
 *     name: 'balanceOf',
 *     type: 'function',
 *     inputs: [{ name: 'account', type: 'address' }],
 *     outputs: [{ name: 'balance', type: 'uint256' }],
 *     stateMutability: 'view',
 *   },
 *   // ...
 * ])
 * const balanceOf = AbiFunction.fromAbi(abi, 'balanceOf')
 *
 * // 2. Encode the Function Input.
 * const data = AbiFunction.encodeData(
 *   balanceOf,
 *   ['0xd2135CfB216b74109775236E36d4b433F1DF507B']
 * )
 *
 * // 3. Perform the Contract Call.
 * const response = await window.ethereum!.request({
 *   method: 'eth_call',
 *   params: [
 *     {
 *       data,
 *       to: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 *     },
 *   ],
 * })
 *
 * // 4. Decode the Function Output. // [!code focus]
 * const balance = AbiFunction.decodeResult(balanceOf, response) // [!code focus]
 * // @log: 42n
 * ```
 *
 * :::note
 *
 * For simplicity, the above example uses `window.ethereum.request`, but you can use any
 * type of JSON-RPC interface.
 *
 * :::
 *
 * @param abiFunction - ABI Function to decode
 * @param data - ABI-encoded function output
 * @param options - Decoding options
 * @returns Decoded function output
 */
export function AbiFunction_decodeResult<
  const abiFunction extends AbiFunction,
  as extends 'Object' | 'Array' = 'Array',
>(
  abiFunction: abiFunction | AbiFunction,
  data: Hex,
  options: AbiFunction_decodeResult.Options<as> = {},
): AbiFunction_decodeResult.ReturnType<abiFunction, as> {
  const values = AbiParameters_decode(abiFunction.outputs, data, options)
  if (values && Object.keys(values).length === 0) return undefined
  if (values && Object.keys(values).length === 1) {
    if (Array.isArray(values)) return values[0]
    return Object.values(values)[0]
  }
  return values
}

export declare namespace AbiFunction_decodeResult {
  type Options<as extends 'Object' | 'Array'> = {
    /**
     * Whether the decoded values should be returned as an `Object` or `Array`.
     *
     * @default "Array"
     */
    as?: as | 'Array' | 'Object' | undefined
  }

  type ReturnType<
    abiFunction extends AbiFunction = AbiFunction,
    as extends 'Object' | 'Array' = 'Array',
  > = IsNarrowable<abiFunction, AbiFunction> extends true
    ? abiFunction['outputs'] extends readonly []
      ? undefined
      : abiFunction['outputs'] extends readonly [
            infer type extends AbiParameter,
          ]
        ? AbiParameterToPrimitiveType<type>
        : AbiParameters_decode.ReturnType<
              abiFunction['outputs'],
              as
            > extends infer types
          ? types extends readonly []
            ? undefined
            : types extends readonly [infer type]
              ? type
              : types
          : never
    : unknown

  type ErrorType = AbiParameters_decode.ErrorType | Errors.GlobalErrorType
}
