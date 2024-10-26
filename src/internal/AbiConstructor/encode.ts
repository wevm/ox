import type { AbiParametersToPrimitiveTypes } from 'abitype'

import * as AbiParameters from '../../AbiParameters.js'
import * as Hex from '../../Hex.js'
import type * as AbiConstructor from '../../AbiConstructor.js'
import type * as Errors from '../../Errors.js'
import type { IsNarrowable } from '../types.js'

export function encode<
  const abiConstructor extends AbiConstructor.AbiConstructor,
>(
  abiConstructor: abiConstructor | AbiConstructor.AbiConstructor,
  options: AbiConstructor.encode.Options<abiConstructor>,
): AbiConstructor.encode.ReturnType

/**
 * ABI-encodes the provided constructor input (`inputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.from('constructor(address, uint256)')
 *
 * const data = AbiConstructor.encode(constructor, {
 *   bytecode: '0x...',
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n],
 * })
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `AbiConstructor.encode` to encode the constructor of a contract and deploy it.
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { AbiConstructor, Hex } from 'ox'
 *
 * // 1. Instantiate the ABI Constructor.
 * const constructor = AbiConstructor.from(
 *   'constructor(address owner, uint256 amount)',
 * )
 *
 * // 2. Encode the ABI Constructor.
 * const data = AbiConstructor.encode(constructor, {
 *   bytecode: '0x...',
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n],
 * })
 *
 * // 3. Deploy the contract.
 * const hash = await window.ethereum!.request({
 *   method: 'eth_sendTransaction',
 *   params: [{ data }],
 * })
 * ```
 *
 * :::note
 *
 * For simplicity, the above example uses `window.ethereum.request`, but you can use any
 * type of JSON-RPC interface.
 *
 * :::
 *
 * @param abiConstructor - The ABI Constructor to encode.
 * @param options - Encoding options.
 * @returns The encoded constructor.
 */
export function encode(
  abiConstructor: AbiConstructor.AbiConstructor,
  options: AbiConstructor.encode.Options,
): AbiConstructor.encode.ReturnType {
  const { bytecode, args } = options
  return Hex.concat(
    bytecode,
    abiConstructor.inputs?.length && args?.length
      ? AbiParameters.encode(abiConstructor.inputs, args)
      : '0x',
  )
}

export declare namespace encode {
  type Options<
    abiConstructor extends
      AbiConstructor.AbiConstructor = AbiConstructor.AbiConstructor,
    ///
    args extends AbiParametersToPrimitiveTypes<
      abiConstructor['inputs']
    > = AbiParametersToPrimitiveTypes<abiConstructor['inputs']>,
  > = {
    bytecode: Hex.Hex
  } & (IsNarrowable<abiConstructor, AbiConstructor.AbiConstructor> extends true
    ? args extends readonly []
      ? { args?: undefined }
      : { args: AbiParametersToPrimitiveTypes<abiConstructor['inputs']> }
    : { args?: readonly unknown[] | undefined })

  type ReturnType = Hex.Hex

  type ErrorType =
    | Hex.concat.ErrorType
    | AbiParameters.encode.ErrorType
    | Errors.GlobalErrorType
}

encode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor.encode.ErrorType
