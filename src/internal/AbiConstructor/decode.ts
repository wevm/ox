import type { AbiParametersToPrimitiveTypes } from 'abitype'

import * as AbiParameters from '../../AbiParameters.js'
import type * as AbiConstructor from '../../AbiConstructor.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import type { IsNarrowable } from '../types.js'

export function decode<
  const abiConstructor extends AbiConstructor.AbiConstructor,
>(
  abiConstructor: abiConstructor,
  options: AbiConstructor.decode.Options,
): AbiConstructor.decode.ReturnType<abiConstructor>

/**
 * ABI-decodes the provided constructor input (`inputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.from('constructor(address, uint256)')
 *
 * const bytecode = '0x...'
 *
 * const data = AbiConstructor.encode(constructor, {
 *   bytecode,
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n],
 * })
 *
 * const decoded = AbiConstructor.decode(constructor, { // [!code focus]
 *   bytecode, // [!code focus]
 *   data, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param abiConstructor - The ABI Constructor to decode.
 * @param data - The encoded constructor inputs.
 * @returns The decoded constructor inputs.
 */
export function decode(
  abiConstructor: AbiConstructor.AbiConstructor,
  options: AbiConstructor.decode.Options,
): AbiConstructor.decode.ReturnType {
  const { bytecode } = options

  if (abiConstructor.inputs.length === 0) return undefined

  const data = options.data.replace(bytecode, '0x') as Hex.Hex
  return AbiParameters.decode(abiConstructor.inputs, data)
}

export declare namespace decode {
  type Options = {
    bytecode: Hex.Hex
    data: Hex.Hex
  }

  type ReturnType<
    abiConstructor extends
      AbiConstructor.AbiConstructor = AbiConstructor.AbiConstructor,
  > =
    | (abiConstructor['inputs']['length'] extends 0
        ? undefined
        : AbiParametersToPrimitiveTypes<abiConstructor['inputs']>)
    | (IsNarrowable<abiConstructor, AbiConstructor.AbiConstructor> extends true
        ? never
        : undefined)

  type ErrorType = AbiParameters.decode.ErrorType | Errors.GlobalErrorType
}

decode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor.decode.ErrorType
