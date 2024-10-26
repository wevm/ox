import type { AbiParametersToPrimitiveTypes } from 'abitype'
import type * as AbiConstructor from '../../AbiConstructor.js'
import * as AbiParameters from '../../AbiParameters.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import type { IsNarrowable } from '../types.js'

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
export function decode<
  const abiConstructor extends AbiConstructor.AbiConstructor,
>(
  abiConstructor: abiConstructor | AbiConstructor.AbiConstructor,
  options: decode.Options,
): Hex.Hex {
  const { bytecode } = options
  const data = options.data.replace(bytecode, '0x')
  const decoded = AbiParameters.decode(abiConstructor.inputs, data as Hex.Hex)
  if (decoded.length === 0) return undefined as never
  return decoded as never
}

export declare namespace decode {
  type Options = {
    bytecode: Hex.Hex
    data: Hex.Hex
  }

  type ReturnType<
    abiConstructor extends
      AbiConstructor.AbiConstructor = AbiConstructor.AbiConstructor,
  > = IsNarrowable<abiConstructor, AbiConstructor.AbiConstructor> extends true
    ? AbiParametersToPrimitiveTypes<
        abiConstructor['inputs']
      > extends readonly []
      ? undefined
      : AbiParametersToPrimitiveTypes<abiConstructor['inputs']>
    : readonly unknown[]

  type ErrorType = Errors.GlobalErrorType
}

decode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as decode.ErrorType
