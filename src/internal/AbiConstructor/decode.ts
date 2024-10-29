import type { AbiParametersToPrimitiveTypes } from 'abitype'
import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import { AbiParameters_decode } from '../AbiParameters/decode.js'
import type { IsNarrowable } from '../types.js'
import type { AbiConstructor } from './types.js'

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
 * @param options - Decoding options.
 * @returns The decoded constructor inputs.
 */
export function AbiConstructor_decode<
  const abiConstructor extends AbiConstructor,
>(
  abiConstructor: abiConstructor | AbiConstructor,
  options: AbiConstructor_decode.Options,
): Hex {
  const { bytecode } = options
  const data = options.data.replace(bytecode, '0x')
  const decoded = AbiParameters_decode(abiConstructor.inputs, data as Hex)
  if (decoded.length === 0) return undefined as never
  return decoded as never
}

export declare namespace AbiConstructor_decode {
  type Options = {
    bytecode: Hex
    data: Hex
  }

  type ReturnType<abiConstructor extends AbiConstructor = AbiConstructor> =
    IsNarrowable<abiConstructor, AbiConstructor> extends true
      ? AbiParametersToPrimitiveTypes<
          abiConstructor['inputs']
        > extends readonly []
        ? undefined
        : AbiParametersToPrimitiveTypes<abiConstructor['inputs']>
      : readonly unknown[]

  type ErrorType = Errors.GlobalErrorType
}

AbiConstructor_decode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor_decode.ErrorType
