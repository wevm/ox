import type { AbiParameter, AbiParameterToPrimitiveType } from 'abitype'
import { AbiItem_InvalidSelectorSizeError } from '../AbiItem/errors.js'
import { AbiParameters_decode } from '../AbiParameters/decode.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_size } from '../Hex/size.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import type { AbiError } from './types.js'

/**
 * ABI-decodes the provided error input (`inputs`).
 *
 * :::tip
 *
 * This function is typically used to decode contract function reverts (e.g. a JSON-RPC error response).
 *
 * See the [End-to-end Example](#end-to-end).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const error = AbiError.from('error InvalidSignature(uint r, uint s, uint8 yParity)')
 *
 * const value = AbiError.decode(error, '0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001')
 * // @log: [420n, 69n, 1]
 * ```
 *
 * @example
 * You can extract an ABI Error from a JSON ABI with {@link ox#AbiError.(fromAbi:function)}:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([...]) // [!code hl]
 * const error = AbiError.fromAbi(abi, 'InvalidSignature') // [!code hl]
 *
 * const value = AbiError.decode(error, '0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001')
 * // @log: [420n, 69n, 1]
 * ```
 *
 * @example
 * You can pass the error `data` to the `name` property of {@link ox#AbiError.(fromAbi:function)} to extract and infer the error by its 4-byte selector:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiError } from 'ox'
 *
 * const data = '0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001'
 *
 * const abi = Abi.from([...])
 * const error = AbiError.fromAbi(abi, data) // [!code hl]
 *
 * const value = AbiError.decode(error, data)
 * // @log: [420n, 69n, 1]
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `AbiError.decode` to decode the revert error of an `approve` contract call on the [Wagmi Mint Example contract](https://etherscan.io/address/0xfba3912ca04dd458c843e2ee08967fc04f3579c2).
 *
 * ```ts twoslash
 * // @noErrors
 * import 'ox/window'
 * import { Abi, AbiError, AbiFunction } from 'ox'
 *
 * // 1. Extract the Function from the Contract's ABI.
 * const abi = Abi.from([
 *   // ...
 *   {
 *     inputs: [
 *       { name: 'to', type: 'address' },
 *       { name: 'tokenId', type: 'uint256' },
 *     ],
 *     name: 'approve',
 *     outputs: [],
 *     stateMutability: 'nonpayable',
 *     type: 'function',
 *   },
 *   // ...
 * ])
 * const approve = AbiFunction.fromAbi(abi, 'approve')
 *
 * // 2. Encode the Function Input.
 * const data = AbiFunction.encodeData(
 *   approve,
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * )
 *
 * try {
 *   // 3. Attempt to perform the the Contract Call.
 *   await window.ethereum!.request({
 *     method: 'eth_call',
 *     params: [
 *       {
 *         data,
 *         to: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 *       },
 *     ],
 *   })
 * } catch (e) { // [!code focus]
 *   // 4. Extract and decode the Error. // [!code focus]
 *   const error = AbiError.fromAbi(abi, e.data) // [!code focus]
 *   const value = AbiError.decode(error, e.data) // [!code focus]
 *   console.error(`${error.name}(${value})`) // [!code focus]
 * // @error:   Error(ERC721: approve caller is not owner nor approved for all)
 * } // [!code focus]
 * ```
 *
 * :::note
 *
 * For simplicity, the above example uses `window.ethereum.request`, but you can use any
 * type of JSON-RPC interface.
 *
 * :::
 *
 * @param abiError - The ABI Error to decode.
 * @param data - The error data.
 * @param options - Decoding options.
 * @returns The decoded error.
 */
export function AbiError_decode<
  const abiError extends AbiError,
  as extends 'Object' | 'Array' = 'Array',
>(
  abiError: abiError | AbiError,
  data: Hex,
  options: AbiError_decode.Options<as> = {},
): AbiError_decode.ReturnType<abiError, as> {
  if (Hex_size(data) < 4) throw new AbiItem_InvalidSelectorSizeError({ data })
  if (abiError.inputs.length === 0) return undefined

  const values = AbiParameters_decode(
    abiError.inputs,
    Hex_slice(data, 4),
    options,
  )
  if (values && Object.keys(values).length === 1) {
    if (Array.isArray(values)) return values[0]
    return Object.values(values)[0]
  }
  return values
}

export declare namespace AbiError_decode {
  type Options<as extends 'Object' | 'Array'> = {
    /**
     * Whether the decoded values should be returned as an `Object` or `Array`.
     *
     * @default "Array"
     */
    as?: as | 'Array' | 'Object' | undefined
  }

  type ReturnType<
    abiError extends AbiError = AbiError,
    as extends 'Object' | 'Array' = 'Array',
  > = IsNarrowable<abiError, AbiError> extends true
    ? abiError['inputs'] extends readonly []
      ? undefined
      : abiError['inputs'] extends readonly [infer type extends AbiParameter]
        ? AbiParameterToPrimitiveType<type>
        : AbiParameters_decode.ReturnType<
              abiError['inputs'],
              as
            > extends infer types
          ? types extends readonly []
            ? undefined
            : types extends readonly [infer type]
              ? type
              : types
          : never
    : unknown

  type ErrorType =
    | AbiParameters_decode.ErrorType
    | Hex_size.ErrorType
    | AbiItem_InvalidSelectorSizeError
    | GlobalErrorType
}
