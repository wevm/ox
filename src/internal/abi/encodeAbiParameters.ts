import type {
  AbiParameter,
  AbiParameterToPrimitiveType,
  AbiType,
  AbiTypeToPrimitiveType,
  ParseAbiParameter,
} from 'abitype'
import { parseAbiParameter } from 'abitype'

import { assertAddress } from '../address/assertAddress.js'
import { concatHex } from '../data/concat.js'
import { padLeft, padRight } from '../data/pad.js'
import { size } from '../data/size.js'
import { slice } from '../data/slice.js'
import {
  AbiEncodingArrayLengthMismatchError,
  AbiEncodingBytesSizeMismatchError,
  AbiEncodingInvalidArrayError,
  AbiEncodingLengthMismatchError,
  InvalidAbiTypeError,
} from '../errors/abi.js'
import { BaseError } from '../errors/base.js'
import type { GlobalErrorType } from '../errors/error.js'
import { booleanToHex, numberToHex, stringToHex } from '../hex/toHex.js'
import type { Hex } from '../types/data.js'
import type { Compute } from '../types/utils.js'
import type { TupleAbiParameter } from './decodeAbiParameters.js'

// TODO: These types should be in abitype?
/** @internal */
export type IsomorphicAbiParameter = AbiParameter | AbiType | (string & {})

/** @internal */
export type IsomorphicAbiParametersToPrimitiveTypes<
  types extends readonly IsomorphicAbiParameter[],
> = Compute<{
  [key in keyof types]: types[key] extends AbiParameter
    ? AbiParameterToPrimitiveType<types[key]>
    : types[key] extends AbiType
      ? AbiParameterToPrimitiveType<{ type: types[key] }>
      : types[key] extends string | readonly string[] | readonly unknown[]
        ? AbiParameterToPrimitiveType<ParseAbiParameter<types[key]>>
        : never
}>

/**
 * Encodes primitive values into ABI encoded data as per the [Application Binary Interface (ABI) Specification](https://docs.soliditylang.org/en/latest/abi-spec).
 *
 * @example
 * ```ts
 * import { Abi } from 'ox'
 *
 * const data = Abi.encodeParameters(
 *   ['string', 'uint', 'bool'],
 *   ['wagmi', 420n, true]
 * )
 * ```
 *
 * You can also pass in Human Readable parameters with the `Abi.parseParameters` utility.
 *
 * @example
 * ```ts
 * import { Abi } from 'ox'
 *
 * const data = Abi.encodeParameters(
 *   Abi.parseParameters('string x, uint y, bool z'),
 *   ['wagmi', 420n, true]
 * )
 * ```
 */
export function encodeAbiParameters<
  const parameters extends
    | readonly IsomorphicAbiParameter[]
    | readonly unknown[],
>(
  parameters: parameters,
  values: parameters extends readonly IsomorphicAbiParameter[]
    ? IsomorphicAbiParametersToPrimitiveTypes<parameters>
    : never,
): encodeAbiParameters.ReturnType {
  if (parameters.length !== values.length)
    throw new AbiEncodingLengthMismatchError({
      expectedLength: parameters.length as number,
      givenLength: values.length as any,
    })
  // Prepare the parameters to determine dynamic types to encode.
  const preparedParameters = prepareParameters({
    parameters: parameters as readonly AbiParameter[],
    values: values as any,
  })
  const data = encodeParameters(preparedParameters)
  if (data.length === 0) return '0x'
  return data
}

export declare namespace encodeAbiParameters {
  type ReturnType = Hex

  type ErrorType =
    | AbiEncodingLengthMismatchError
    | encodeParameters.ErrorType
    | prepareParameters.ErrorType
    | GlobalErrorType
}

encodeAbiParameters.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as encodeAbiParameters.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type PreparedParameter = { dynamic: boolean; encoded: Hex }

/** @internal */
export type Tuple = AbiParameterToPrimitiveType<TupleAbiParameter>

/** @internal */
export function prepareParameters<
  const parameters extends readonly IsomorphicAbiParameter[],
>({
  parameters,
  values,
}: {
  parameters: parameters
  values: parameters extends readonly IsomorphicAbiParameter[]
    ? IsomorphicAbiParametersToPrimitiveTypes<parameters>
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
  type ErrorType = prepareParameter.ErrorType | GlobalErrorType
}

/** @internal */
export function prepareParameter<
  const parameter extends IsomorphicAbiParameter,
>({
  parameter: parameter_,
  value,
}: {
  parameter: parameter
  value: parameter extends AbiParameter
    ? AbiParameterToPrimitiveType<parameter>
    : parameter extends AbiType
      ? AbiTypeToPrimitiveType<parameter>
      : never
}): PreparedParameter {
  const parameter = (
    typeof parameter_ === 'string'
      ? parseAbiParameter(parameter_ as string)
      : parameter_
  ) as AbiParameter

  const arrayComponents = getArrayComponents(parameter.type)
  if (arrayComponents) {
    const [length, type] = arrayComponents
    return encodeArray(value, {
      length,
      parameter: {
        ...(typeof parameter === 'object' ? parameter : {}),
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
  throw new InvalidAbiTypeError(parameter.type)
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
    | InvalidAbiTypeError
    | GlobalErrorType
}

/////////////////////////////////////////////////////////////////

/** @internal */
export function encodeParameters(preparedParameters: PreparedParameter[]): Hex {
  // 1. Compute the size of the static part of the parameters.
  let staticSize = 0
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i]!
    if (dynamic) staticSize += 32
    else staticSize += size(encoded)
  }

  // 2. Split the parameters into static and dynamic parts.
  const staticParameters: Hex[] = []
  const dynamicParameters: Hex[] = []
  let dynamicSize = 0
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i]!
    if (dynamic) {
      staticParameters.push(numberToHex(staticSize + dynamicSize, { size: 32 }))
      dynamicParameters.push(encoded)
      dynamicSize += size(encoded)
    } else {
      staticParameters.push(encoded)
    }
  }

  // 3. Concatenate static and dynamic parts.
  return concatHex(...staticParameters, ...dynamicParameters)
}

/** @internal */
export declare namespace encodeParameters {
  type ErrorType =
    | concatHex.ErrorType
    | numberToHex.ErrorType
    | size.ErrorType
    | GlobalErrorType
}

/////////////////////////////////////////////////////////////////

/** @internal */
export function encodeAddress(value: Hex): PreparedParameter {
  assertAddress(value)
  return { dynamic: false, encoded: padLeft(value.toLowerCase() as Hex) }
}

/** @internal */
export declare namespace encodeAddress {
  type ErrorType = assertAddress.ErrorType | padLeft.ErrorType | GlobalErrorType
}

/** @internal */
export function encodeArray<const parameter extends AbiParameter>(
  value: AbiParameterToPrimitiveType<parameter>,
  {
    length,
    parameter,
  }: {
    length: number | null
    parameter: parameter
  },
): PreparedParameter {
  const dynamic = length === null

  if (!Array.isArray(value)) throw new AbiEncodingInvalidArrayError(value)
  if (!dynamic && value.length !== length)
    throw new AbiEncodingArrayLengthMismatchError({
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
    const data = encodeParameters(preparedParameters)
    if (dynamic) {
      const length = numberToHex(preparedParameters.length, { size: 32 })
      return {
        dynamic: true,
        encoded:
          preparedParameters.length > 0 ? concatHex(length, data) : length,
      }
    }
    if (dynamicChild) return { dynamic: true, encoded: data }
  }
  return {
    dynamic: false,
    encoded: concatHex(...preparedParameters.map(({ encoded }) => encoded)),
  }
}

/** @internal */
export declare namespace encodeArray {
  type ErrorType =
    | AbiEncodingInvalidArrayError
    | AbiEncodingArrayLengthMismatchError
    | concatHex.ErrorType
    | numberToHex.ErrorType
    | GlobalErrorType
}

/** @internal */
export function encodeBytes(
  value: Hex,
  { type }: { type: string },
): PreparedParameter {
  const [, parametersize] = type.split('bytes')
  const bytesSize = size(value)
  if (!parametersize) {
    let value_ = value
    // If the size is not divisible by 32 bytes, pad the end
    // with empty bytes to the ceiling 32 bytes.
    if (bytesSize % 32 !== 0)
      value_ = padRight(value_, Math.ceil((value.length - 2) / 2 / 32) * 32)
    return {
      dynamic: true,
      encoded: concatHex(padLeft(numberToHex(bytesSize, { size: 32 })), value_),
    }
  }
  if (bytesSize !== Number.parseInt(parametersize))
    throw new AbiEncodingBytesSizeMismatchError({
      expectedSize: Number.parseInt(parametersize),
      value,
    })
  return { dynamic: false, encoded: padRight(value) }
}

/** @internal */
export declare namespace encodeBytes {
  type ErrorType =
    | padLeft.ErrorType
    | padRight.ErrorType
    | numberToHex.ErrorType
    | slice.ErrorType
    | GlobalErrorType
}

/** @internal */
export function encodeBoolean(value: boolean): PreparedParameter {
  if (typeof value !== 'boolean')
    throw new BaseError(
      `Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`,
    )
  return { dynamic: false, encoded: padLeft(booleanToHex(value)) }
}

/** @internal */
export declare namespace encodeBoolean {
  type ErrorType = padLeft.ErrorType | booleanToHex.ErrorType | GlobalErrorType
}

/** @internal */
export function encodeNumber(
  value: number,
  { signed }: { signed: boolean },
): PreparedParameter {
  return {
    dynamic: false,
    encoded: numberToHex(value, {
      size: 32,
      signed,
    }),
  }
}

/** @internal */
export declare namespace encodeNumber {
  type ErrorType = numberToHex.ErrorType | GlobalErrorType
}

/** @internal */
export function encodeString(value: string): PreparedParameter {
  const hexValue = stringToHex(value)
  const partsLength = Math.ceil(size(hexValue) / 32)
  const parts: Hex[] = []
  for (let i = 0; i < partsLength; i++) {
    parts.push(padRight(slice(hexValue, i * 32, (i + 1) * 32)))
  }
  return {
    dynamic: true,
    encoded: concatHex(
      padRight(numberToHex(size(hexValue), { size: 32 })),
      ...parts,
    ),
  }
}

/** @internal */
export declare namespace encodeString {
  type ErrorType =
    | numberToHex.ErrorType
    | padRight.ErrorType
    | slice.ErrorType
    | size.ErrorType
    | GlobalErrorType
}

/** @internal */
export function encodeTuple<
  const parameter extends AbiParameter & {
    components: readonly AbiParameter[]
  },
>(
  value: AbiParameterToPrimitiveType<parameter>,
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
      ? encodeParameters(preparedParameters)
      : concatHex(...preparedParameters.map(({ encoded }) => encoded)),
  }
}

/** @internal */
export declare namespace encodeTuple {
  type ErrorType = concatHex.ErrorType | GlobalErrorType
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
