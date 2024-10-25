import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'
import { BaseError } from '../Errors/base.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_fromBoolean } from '../Hex/fromBoolean.js'
import { Hex_fromNumber } from '../Hex/fromNumber.js'
import { Hex_fromString } from '../Hex/fromString.js'
import { Hex_padLeft, Hex_padRight } from '../Hex/pad.js'
import { Hex_size } from '../Hex/size.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { TupleAbiParameter } from './decode.js'
import {
  AbiParameters_ArrayLengthMismatchError,
  AbiParameters_BytesSizeMismatchError,
  AbiParameters_InvalidArrayError,
  AbiParameters_InvalidTypeError,
  AbiParameters_LengthMismatchError,
} from './errors.js'
import type {
  AbiParameters,
  AbiParameters_Parameter,
  AbiParameters_ParameterToPrimitiveType,
  AbiParameters_ToPrimitiveTypes,
} from './types.js'

/**
 * Encodes primitive values into ABI encoded data as per the [Application Binary Interface (ABI) Specification](https://docs.soliditylang.org/en/latest/abi-spec).
 *
 * @example
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const data = AbiParameters.encode(
 *   AbiParameters.from(['string', 'uint', 'bool']),
 *   ['wagmi', 420n, true],
 * )
 * ```
 *
 * @example
 * ### JSON Parameters
 *
 * Specify **JSON ABI** Parameters as schema:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const data = AbiParameters.encode(
 *   [
 *     { type: 'string', name: 'name' },
 *     { type: 'uint', name: 'age' },
 *     { type: 'bool', name: 'isOwner' },
 *   ],
 *   ['wagmi', 420n, true],
 * )
 * ```
 *
 * @param parameters - The set of ABI parameters to encode, in the shape of the `inputs` or `outputs` attribute of an ABI Item. These parameters must include valid [ABI types](https://docs.soliditylang.org/en/latest/types.html).
 * @param values - The set of primitive values that correspond to the ABI types defined in `parameters`.
 * @returns ABI encoded data.
 */
export function AbiParameters_encode<
  const parameters extends AbiParameters | readonly unknown[],
>(
  parameters: parameters,
  values: parameters extends AbiParameters
    ? AbiParameters_ToPrimitiveTypes<parameters>
    : never,
): Hex {
  if (parameters.length !== values.length)
    throw new AbiParameters_LengthMismatchError({
      expectedLength: parameters.length as number,
      givenLength: values.length as any,
    })
  // Prepare the parameters to determine dynamic types to encode.
  const preparedParameters = prepareParameters({
    parameters: parameters as readonly AbiParameters_Parameter[],
    values: values as any,
  })
  const data = encode(preparedParameters)
  if (data.length === 0) return '0x'
  return data
}

export declare namespace AbiParameters_encode {
  type ErrorType =
    | AbiParameters_LengthMismatchError
    | encode.ErrorType
    | prepareParameters.ErrorType
    | Errors.GlobalErrorType
}

AbiParameters_encode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiParameters_encode.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type PreparedParameter = { dynamic: boolean; encoded: Hex }

/** @internal */
export type Tuple = AbiParameters_ParameterToPrimitiveType<TupleAbiParameter>

/** @internal */
export function prepareParameters<const parameters extends AbiParameters>({
  parameters,
  values,
}: {
  parameters: parameters
  values: parameters extends AbiParameters
    ? AbiParameters_ToPrimitiveTypes<parameters>
    : never
}) {
  const preparedParameters: PreparedParameter[] = []
  for (let i = 0; i < parameters.length; i++) {
    preparedParameters.push(
      prepareParameter({ parameter: parameters[i]!, value: values[i] }),
    )
  }
  return preparedParameters
}

/** @internal */
export declare namespace prepareParameters {
  type ErrorType = prepareParameter.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function prepareParameter<
  const parameter extends AbiParameters_Parameter,
>({
  parameter: parameter_,
  value,
}: {
  parameter: parameter
  value: parameter extends AbiParameters_Parameter
    ? AbiParameters_ParameterToPrimitiveType<parameter>
    : never
}): PreparedParameter {
  const parameter = parameter_ as AbiParameters_Parameter

  const arrayComponents = getArrayComponents(parameter.type)
  if (arrayComponents) {
    const [length, type] = arrayComponents
    return encodeArray(value, {
      length,
      parameter: {
        ...parameter,
        type,
      },
    })
  }
  if (parameter.type === 'tuple') {
    return encodeTuple(value as unknown as Tuple, {
      parameter: parameter as TupleAbiParameter,
    })
  }
  if (parameter.type === 'address') {
    return encodeAddress(value as unknown as Hex)
  }
  if (parameter.type === 'bool') {
    return encodeBoolean(value as unknown as boolean)
  }
  if (parameter.type.startsWith('uint') || parameter.type.startsWith('int')) {
    const signed = parameter.type.startsWith('int')
    return encodeNumber(value as unknown as number, { signed })
  }
  if (parameter.type.startsWith('bytes')) {
    return encodeBytes(value as unknown as Hex, { type: parameter.type })
  }
  if (parameter.type === 'string') {
    return encodeString(value as unknown as string)
  }
  throw new AbiParameters_InvalidTypeError(parameter.type)
}

/** @internal */
export declare namespace prepareParameter {
  type ErrorType =
    | encodeArray.ErrorType
    | encodeTuple.ErrorType
    | encodeAddress.ErrorType
    | encodeBoolean.ErrorType
    | encodeBytes.ErrorType
    | encodeString.ErrorType
    | AbiParameters_InvalidTypeError
    | Errors.GlobalErrorType
}

/////////////////////////////////////////////////////////////////

/** @internal */
export function encode(preparedParameters: PreparedParameter[]): Hex {
  // 1. Compute the size of the static part of the parameters.
  let staticSize = 0
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i]!
    if (dynamic) staticSize += 32
    else staticSize += Hex_size(encoded)
  }

  // 2. Split the parameters into static and dynamic parts.
  const staticParameters: Hex[] = []
  const dynamicParameters: Hex[] = []
  let dynamicSize = 0
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i]!
    if (dynamic) {
      staticParameters.push(
        Hex_fromNumber(staticSize + dynamicSize, { size: 32 }),
      )
      dynamicParameters.push(encoded)
      dynamicSize += Hex_size(encoded)
    } else {
      staticParameters.push(encoded)
    }
  }

  // 3. Concatenate static and dynamic parts.
  return Hex_concat(...staticParameters, ...dynamicParameters)
}

/** @internal */
export declare namespace encode {
  type ErrorType =
    | Hex_concat.ErrorType
    | Hex_fromNumber.ErrorType
    | Hex_size.ErrorType
    | Errors.GlobalErrorType
}

/////////////////////////////////////////////////////////////////

/** @internal */
export function encodeAddress(value: Hex): PreparedParameter {
  Address.assert(value)
  return { dynamic: false, encoded: Hex_padLeft(value.toLowerCase() as Hex) }
}

/** @internal */
export declare namespace encodeAddress {
  type ErrorType =
    | Address.assert.ErrorType
    | Hex_padLeft.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeArray<const parameter extends AbiParameters_Parameter>(
  value: AbiParameters_ParameterToPrimitiveType<parameter>,
  {
    length,
    parameter,
  }: {
    length: number | null
    parameter: parameter
  },
): PreparedParameter {
  const dynamic = length === null

  if (!Array.isArray(value)) throw new AbiParameters_InvalidArrayError(value)
  if (!dynamic && value.length !== length)
    throw new AbiParameters_ArrayLengthMismatchError({
      expectedLength: length!,
      givenLength: value.length,
      type: `${parameter.type}[${length}]`,
    })

  let dynamicChild = false
  const preparedParameters: PreparedParameter[] = []
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParameter({ parameter, value: value[i] })
    if (preparedParam.dynamic) dynamicChild = true
    preparedParameters.push(preparedParam)
  }

  if (dynamic || dynamicChild) {
    const data = encode(preparedParameters)
    if (dynamic) {
      const length = Hex_fromNumber(preparedParameters.length, { size: 32 })
      return {
        dynamic: true,
        encoded:
          preparedParameters.length > 0 ? Hex_concat(length, data) : length,
      }
    }
    if (dynamicChild) return { dynamic: true, encoded: data }
  }
  return {
    dynamic: false,
    encoded: Hex_concat(...preparedParameters.map(({ encoded }) => encoded)),
  }
}

/** @internal */
export declare namespace encodeArray {
  type ErrorType =
    | AbiParameters_InvalidArrayError
    | AbiParameters_ArrayLengthMismatchError
    | Hex_concat.ErrorType
    | Hex_fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeBytes(
  value: Hex,
  { type }: { type: string },
): PreparedParameter {
  const [, parametersize] = type.split('bytes')
  const bytesSize = Hex_size(value)
  if (!parametersize) {
    let value_ = value
    // If the size is not divisible by 32 bytes, pad the end
    // with empty bytes to the ceiling 32 bytes.
    if (bytesSize % 32 !== 0)
      value_ = Hex_padRight(value_, Math.ceil((value.length - 2) / 2 / 32) * 32)
    return {
      dynamic: true,
      encoded: Hex_concat(
        Hex_padLeft(Hex_fromNumber(bytesSize, { size: 32 })),
        value_,
      ),
    }
  }
  if (bytesSize !== Number.parseInt(parametersize))
    throw new AbiParameters_BytesSizeMismatchError({
      expectedSize: Number.parseInt(parametersize),
      value,
    })
  return { dynamic: false, encoded: Hex_padRight(value) }
}

/** @internal */
export declare namespace encodeBytes {
  type ErrorType =
    | Hex_padLeft.ErrorType
    | Hex_padRight.ErrorType
    | Hex_fromNumber.ErrorType
    | Hex_slice.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeBoolean(value: boolean): PreparedParameter {
  if (typeof value !== 'boolean')
    throw new BaseError(
      `Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`,
    )
  return { dynamic: false, encoded: Hex_padLeft(Hex_fromBoolean(value)) }
}

/** @internal */
export declare namespace encodeBoolean {
  type ErrorType =
    | Hex_padLeft.ErrorType
    | Hex_fromBoolean.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeNumber(
  value: number,
  { signed }: { signed: boolean },
): PreparedParameter {
  return {
    dynamic: false,
    encoded: Hex_fromNumber(value, {
      size: 32,
      signed,
    }),
  }
}

/** @internal */
export declare namespace encodeNumber {
  type ErrorType = Hex_fromNumber.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function encodeString(value: string): PreparedParameter {
  const hexValue = Hex_fromString(value)
  const partsLength = Math.ceil(Hex_size(hexValue) / 32)
  const parts: Hex[] = []
  for (let i = 0; i < partsLength; i++) {
    parts.push(Hex_padRight(Hex_slice(hexValue, i * 32, (i + 1) * 32)))
  }
  return {
    dynamic: true,
    encoded: Hex_concat(
      Hex_padRight(Hex_fromNumber(Hex_size(hexValue), { size: 32 })),
      ...parts,
    ),
  }
}

/** @internal */
export declare namespace encodeString {
  type ErrorType =
    | Hex_fromNumber.ErrorType
    | Hex_padRight.ErrorType
    | Hex_slice.ErrorType
    | Hex_size.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeTuple<
  const parameter extends AbiParameters_Parameter & {
    components: readonly AbiParameters_Parameter[]
  },
>(
  value: AbiParameters_ParameterToPrimitiveType<parameter>,
  { parameter }: { parameter: parameter },
): PreparedParameter {
  let dynamic = false
  const preparedParameters: PreparedParameter[] = []
  for (let i = 0; i < parameter.components.length; i++) {
    const param_ = parameter.components[i]!
    const index = Array.isArray(value) ? i : param_.name
    const preparedParam = prepareParameter({
      parameter: param_,
      value: (value as any)[index!] as readonly unknown[],
    })
    preparedParameters.push(preparedParam)
    if (preparedParam.dynamic) dynamic = true
  }
  return {
    dynamic,
    encoded: dynamic
      ? encode(preparedParameters)
      : Hex_concat(...preparedParameters.map(({ encoded }) => encoded)),
  }
}

/** @internal */
export declare namespace encodeTuple {
  type ErrorType = Hex_concat.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function getArrayComponents(
  type: string,
): [length: number | null, innerType: string] | undefined {
  const matches = type.match(/^(.*)\[(\d+)?\]$/)
  return matches
    ? // Return `null` if the array is dynamic.
      [matches[2]! ? Number(matches[2]!) : null, matches[1]!]
    : undefined
}
