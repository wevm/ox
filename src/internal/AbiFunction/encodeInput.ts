import type { AbiParametersToPrimitiveTypes } from 'abitype'
import { AbiParameters_encode } from '../AbiParameters/encode.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_concat } from '../Hex/concat.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import { AbiFunction_fromAbi } from './fromAbi.js'
import { AbiFunction_getSelector } from './getSelector.js'
import type { AbiFunction } from './types.js'

/**
 * ABI-encodes the provided function input (`inputs`), prefixed with the 4 byte function selector.
 *
 * :::tip
 *
 * This function is typically used to encode a contract function and its arguments for contract calls (e.g. `data` parameter of an `eth_call` or `eth_sendTransaction`).
 *
 * See the [End-to-end Example](#end-to-end).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const approve = AbiFunction.from('function approve(address, uint256)')
 *
 * const data = AbiFunction.encodeInput( // [!code focus]
 *   approve, // [!code focus]
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n] // [!code focus]
 * ) // [!code focus]
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @example
 * You can extract an ABI Function from a JSON ABI with {@link ox#AbiFunction.fromAbi}:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const erc20Abi = Abi.from([...]) // [!code hl]
 * const approve = AbiFunction.fromAbi(erc20Abi, { name: 'approve' }) // [!code hl]
 *
 * const data = AbiFunction.encodeInput(
 *   approve,
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * )
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `AbiFunction.encodeInput` to encode the input of a `balanceOf` contract call on the [Wagmi Mint Example contract](https://etherscan.io/address/0xfba3912ca04dd458c843e2ee08967fc04f3579c2).
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
 * const balanceOf = AbiFunction.fromAbi(abi, { name: 'balanceOf' })
 *
 * // 2. Encode the Function Input. // [!code focus]
 * const data = AbiFunction.encodeInput( // [!code focus]
 *   balanceOf, // [!code focus]
 *   ['0xd2135CfB216b74109775236E36d4b433F1DF507B'] // [!code focus]
 * ) // [!code focus]
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
 * // 4. Decode the Function Output.
 * const balance = AbiFunction.decodeOutput(balanceOf, response)
 * ```
 *
 * :::note
 *
 * For simplicity, the above example uses `window.ethereum.request`, but you can use any
 * type of JSON-RPC interface.
 *
 * :::
 *
 * @param abiFunction - ABI Function to encode
 * @param args - Function arguments
 * @returns ABI-encoded function name and arguments
 */
export function AbiFunction_encodeInput<const abiFunction extends AbiFunction>(
  abiFunction: abiFunction | AbiFunction,
  ...args: AbiFunction_encodeInput.Args<abiFunction>
): Hex {
  const { overloads } = abiFunction

  const item = overloads
    ? (AbiFunction_fromAbi([abiFunction as AbiFunction, ...overloads], {
        name: abiFunction.name,
        args: (args as any)[0],
      }) as AbiFunction)
    : abiFunction

  const selector = AbiFunction_getSelector(item)

  const data =
    args.length > 0
      ? AbiParameters_encode(item.inputs, (args as any)[0])
      : undefined

  return data ? Hex_concat(selector, data) : selector
}

export declare namespace AbiFunction_encodeInput {
  type Args<abiFunction extends AbiFunction = AbiFunction> = IsNarrowable<
    abiFunction,
    AbiFunction
  > extends true
    ?
        | (AbiParametersToPrimitiveTypes<
            abiFunction['inputs']
          > extends readonly []
            ? []
            : [AbiParametersToPrimitiveTypes<abiFunction['inputs']>])
        | (abiFunction['overloads'] extends readonly AbiFunction[]
            ? [
                AbiParametersToPrimitiveTypes<
                  abiFunction['overloads'][number]['inputs']
                >,
              ]
            : [])
    : readonly unknown[]

  type ErrorType = GlobalErrorType
}

AbiFunction_encodeInput.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiFunction_encodeInput.ErrorType
