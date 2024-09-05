import type { AbiParameter, AbiParameterToPrimitiveType } from 'abitype'
import { InvalidSelectorSizeError } from '../AbiItem/errors.js'
import { AbiParameters_decode } from '../AbiParameters/decode.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_size } from '../Hex/size.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import type { AbiError } from './types.js'

export function AbiError_decode<
  const abiError extends AbiError,
  as extends 'Object' | 'Array' = 'Array',
>(
  abiError: abiError | AbiError,
  data: Hex,
  options: AbiError_decode.Options<as> = {},
): AbiError_decode.ReturnType<abiError, as> {
  if (Hex_size(data) < 4) throw new InvalidSelectorSizeError({ data })
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

  type ErrorType = GlobalErrorType
}
