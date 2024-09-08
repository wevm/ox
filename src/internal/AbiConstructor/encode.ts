import type { AbiParametersToPrimitiveTypes } from 'abitype'
import { AbiParameters_encode } from '../AbiParameters/encode.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_concat } from '../Hex/concat.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import type { AbiConstructor } from './types.js'

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
 * // @noErrors
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
 * ])
 *
 * // 3. Deploy the contract.
 * const hash = await window.ethereum.request({
 *   method: 'eth_sendTransaction',
 *   params: [{ data }],
 * })
 * ```
 *
 * @param abiConstructor - The ABI Constructor to encode.
 * @param options - Encoding options.
 * @returns The encoded constructor.
 */
export function AbiConstructor_encode<
  const abiConstructor extends AbiConstructor,
>(
  abiConstructor: abiConstructor | AbiConstructor,
  options: AbiConstructor_encode.Options<abiConstructor>,
): Hex {
  const { bytecode, args } = options
  if (!abiConstructor.inputs || abiConstructor.inputs.length === 0) return '0x'
  return Hex_concat(
    bytecode,
    AbiParameters_encode(abiConstructor.inputs, args as readonly unknown[]),
  )
}

export declare namespace AbiConstructor_encode {
  type Options<abiConstructor extends AbiConstructor = AbiConstructor> = {
    bytecode: Hex
  } & (IsNarrowable<abiConstructor, AbiConstructor> extends true
    ? AbiParametersToPrimitiveTypes<
        abiConstructor['inputs']
      > extends readonly []
      ? { args?: undefined }
      : { args: AbiParametersToPrimitiveTypes<abiConstructor['inputs']> }
    : { args?: readonly unknown[] | undefined })

  type ErrorType = GlobalErrorType
}

AbiConstructor_encode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor_encode.ErrorType
