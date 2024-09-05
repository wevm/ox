import type { AbiParametersToPrimitiveTypes } from 'abitype'
import { AbiParameters_encode } from '../AbiParameters/encode.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import { AbiError_getSelector } from './getSelector.js'
import type { AbiError } from './types.js'

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
 * const data = AbiError.encodeInput( // [!code focus]
 *   error, // [!code focus]
 *   [1n, 2n, 0] // [!code focus]
 * ) // [!code focus]
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @example
 * You can extract an ABI Error from a JSON ABI with {@link ox#AbiError.fromAbi}:
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
 * const error = AbiError.fromAbi(abi, { name: 'InvalidSignature' }) // [!code hl]
 *
 * const data = AbiError.encodeInput(
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
export function AbiError_encode<const abiError extends AbiError>(
  abiError: abiError | AbiError,
  ...args: AbiError_encode.Args<abiError>
): Hex {
  const selector = (() => {
    if (abiError.hash) return Hex_slice(abiError.hash, 0, 4)
    return AbiError_getSelector(abiError)
  })()

  const data =
    args.length > 0
      ? AbiParameters_encode(abiError.inputs, (args as any)[0])
      : undefined

  return data ? Hex_concat(selector, data) : selector
}

export declare namespace AbiError_encode {
  type Args<abiError extends AbiError = AbiError> = IsNarrowable<
    abiError,
    AbiError
  > extends true
    ? AbiParametersToPrimitiveTypes<abiError['inputs']> extends readonly []
      ? []
      : [AbiParametersToPrimitiveTypes<abiError['inputs']>]
    : readonly unknown[]

  type ErrorType = GlobalErrorType
}

AbiError_encode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiError_encode.ErrorType
