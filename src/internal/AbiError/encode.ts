import type { AbiParametersToPrimitiveTypes } from 'abitype'
import * as AbiError from '../../AbiError.js'
import type * as Errors from '../../Errors.js'
import { AbiParameters_encode } from '../AbiParameters/encode.js'
import { Hex_concat } from '../Hex/concat.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'

/**
 * ABI-encodes the provided error input (`inputs`), prefixed with the 4 byte error selector.
 *
 * @example
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const error = AbiError.from(
 *   'error InvalidSignature(uint r, uint s, uint8 yParity)'
 * )
 *
 * const data = AbiError.encode( // [!code focus]
 *   error, // [!code focus]
 *   [1n, 2n, 0] // [!code focus]
 * ) // [!code focus]
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @example
 * You can extract an ABI Error from a JSON ABI with {@link ox#AbiError.(fromAbi:function)}:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([ // [!code hl]
 *   // ... // [!code hl]
 *   { // [!code hl]
 *     name: 'InvalidSignature', // [!code hl]
 *     type: 'error', // [!code hl]
 *     inputs: [ // [!code hl]
 *       { name: 'r', type: 'uint256' }, // [!code hl]
 *       { name: 's', type: 'uint256' }, // [!code hl]
 *       { name: 'yParity', type: 'uint8' }, // [!code hl]
 *     ], // [!code hl]
 *   }, // [!code hl]
 *   // ... // [!code hl]
 * ]) // [!code hl]
 * const error = AbiError.fromAbi(abi, 'InvalidSignature') // [!code hl]
 *
 * const data = AbiError.encode(
 *   error,
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * )
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @param abiError - ABI Error to encode
 * @param args - Error arguments
 * @returns ABI-encoded error name and arguments
 */
export function encode<const abiError extends AbiError.AbiError>(
  abiError: abiError | AbiError.AbiError,
  ...args: encode.Args<abiError>
): Hex {
  const selector = AbiError.getSelector(abiError)

  const data =
    args.length > 0
      ? AbiParameters_encode(abiError.inputs, (args as any)[0])
      : undefined

  return data ? Hex_concat(selector, data) : selector
}

export declare namespace encode {
  type Args<abiError extends AbiError.AbiError = AbiError.AbiError> =
    IsNarrowable<abiError, AbiError.AbiError> extends true
      ? AbiParametersToPrimitiveTypes<abiError['inputs']> extends readonly []
        ? []
        : [AbiParametersToPrimitiveTypes<abiError['inputs']>]
      : readonly unknown[]

  type ErrorType = Errors.GlobalErrorType
}

encode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as encode.ErrorType
