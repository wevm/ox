import type {
  AbiParameter,
  AbiParameterKind,
  AbiParametersToPrimitiveTypes,
  AbiParameterToPrimitiveType,
} from 'abitype'
import * as AbiParameters from '../AbiParameters.js'
import * as Address from '../Address.js'
import * as Bytes from '../Bytes.js'
import * as Errors from '../Errors.js'
import * as Hex from '../Hex.js'
import { integerRegex } from '../Solidity.js'
import * as internal_address from './address.js'
import type * as Cursor from './cursor.js'
import type { Compute, IsNarrowable, UnionToIntersection } from './types.js'

/** @internal */
export type ParameterToPrimitiveType<
  abiParameter extends AbiParameter | { name: string; type: unknown },
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = AbiParameterToPrimitiveType<abiParameter, abiParameterKind>

/**
 * A parameter's ABI encoding, as hex digits without `0x`, so that encoding a
 * list concatenates its parts without slicing a prefix off each.
 *
 * @internal
 */
export type PreparedParameter = { dynamic: boolean; encoded: string }

/** @internal */
export type ToObject<
  parameters extends readonly AbiParameter[],
  kind extends AbiParameterKind = AbiParameterKind,
> = IsNarrowable<parameters, AbiParameters.AbiParameters> extends true
  ? Compute<
      UnionToIntersection<
        {
          [index in keyof parameters]: parameters[index] extends {
            name: infer name extends string
          }
            ? {
                [key in name]: AbiParameterToPrimitiveType<
                  parameters[index],
                  kind
                >
              }
            : {
                [key in index]: AbiParameterToPrimitiveType<
                  parameters[index],
                  kind
                >
              }
        }[number]
      >
    >
  : unknown

/**
 * `AbiParametersToPrimitiveTypes`, but resolves wide parameters
 * (`readonly AbiParameter[]`) to `readonly unknown[]` without walking every
 * ABI type. TypeScript evaluates the wide case to type the values of a generic
 * call (e.g. `AbiParameters.encode(parameters, [...])`), where it costs about
 * 9,000 type instantiations. The result is the same.
 *
 * @internal
 */
export type ToPrimitiveTypes<
  abiParameters extends readonly AbiParameter[],
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = abiParameters extends readonly AbiParameter[]
  ? readonly AbiParameter[] extends abiParameters
    ? readonly unknown[]
    : AbiParametersToPrimitiveTypes<abiParameters, abiParameterKind>
  : never

/** @internal */
export type Tuple = ParameterToPrimitiveType<TupleAbiParameter>

/** @internal */
export function decodeParameter(
  cursor: Cursor.Cursor,
  param: AbiParameters.Parameter,
  options: { checksumAddress?: boolean | undefined; staticPosition: number },
) {
  const { checksumAddress, staticPosition } = options
  const arrayComponents = getArrayComponents(param.type)
  if (arrayComponents) {
    const [length, type] = arrayComponents
    return decodeArray(
      cursor,
      { ...param, type },
      { checksumAddress, length, staticPosition },
    )
  }
  if (param.type === 'tuple')
    return decodeTuple(cursor, param as TupleAbiParameter, {
      checksumAddress,
      staticPosition,
    })
  if (param.type === 'address')
    return decodeAddress(cursor, { checksum: checksumAddress })
  if (param.type === 'bool') return decodeBool(cursor)
  if (param.type.startsWith('bytes'))
    return decodeBytes(cursor, param, { staticPosition })
  if (param.type.startsWith('uint') || param.type.startsWith('int'))
    return decodeNumber(cursor, param)
  if (param.type === 'string') return decodeString(cursor, { staticPosition })
  throw new AbiParameters.InvalidTypeError(param.type)
}

export declare namespace decodeParameter {
  type ErrorType =
    | decodeArray.ErrorType
    | decodeTuple.ErrorType
    | decodeAddress.ErrorType
    | decodeBool.ErrorType
    | decodeBytes.ErrorType
    | decodeNumber.ErrorType
    | decodeString.ErrorType
    | AbiParameters.InvalidTypeError
    | Errors.GlobalErrorType
}

const sizeOfLength = 32
const sizeOfOffset = 32

const arrayRegex = /^(.*)\[(\d+)?\]$/

/** `[max, min]` of each integer type, keyed by `size` and `signed`. */
const integerBounds = new Map<number, readonly [max: bigint, min: bigint]>()

/** @internal */
export function decodeAddress(
  cursor: Cursor.Cursor,
  options: { checksum?: boolean | undefined } = {},
) {
  const { checksum = false } = options
  const value = cursor.readBytes(32)
  // An address occupies the low 20 bytes of the word; the high 12 bytes
  // must be zero padding.
  for (let i = 0; i < 12; i++)
    if (value[i] !== 0)
      throw new Address.InvalidAddressError({
        address: Hex.fromBytes(value),
        cause: new Address.InvalidInputError(),
      })
  const address = `0x${Hex.fromBytes(value).slice(26)}` as const
  return [checksum ? Address.checksum(address) : address, 32]
}

export declare namespace decodeAddress {
  type ErrorType =
    | Address.InvalidAddressError
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function decodeArray(
  cursor: Cursor.Cursor,
  param: AbiParameters.Parameter,
  options: {
    checksumAddress?: boolean | undefined
    length: number | null
    staticPosition: number
  },
) {
  const { checksumAddress, length, staticPosition } = options

  // If the length of the array is not known in advance (dynamic array),
  // this means we will need to wonder off to the pointer and decode.
  // Note: zero-length fixed arrays (`T[0]`) are not dynamic.
  if (length === null) {
    // Dealing with a dynamic type, so get the offset of the array data.
    const offset = toOffset(cursor.readBytes(sizeOfOffset))

    // Start is the static position of current slot + offset.
    const start = staticPosition + offset
    const startOfData = start + sizeOfLength

    // Get the length of the array from the offset.
    cursor.setPosition(start)
    const length = toOffset(cursor.readBytes(sizeOfLength))

    // Check if the array has any dynamic children.
    const dynamicChild = hasDynamicChild(param)

    let consumed = 0
    const value: unknown[] = []
    for (let i = 0; i < length; ++i) {
      // If any of the children is dynamic, then all elements will be offset pointer, thus size of one slot (32 bytes).
      // Otherwise, elements will be the size of their encoding (consumed bytes).
      cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed))
      const [data, consumed_] = decodeParameter(cursor, param, {
        checksumAddress,
        staticPosition: startOfData,
      })
      consumed += consumed_
      value.push(data)
      // Charge zero-width elements against the read limit to bound work
      // on huge lengths of zero-width types (e.g. `uint256[0][]`).
      if (consumed_ === 0) {
        cursor.assertReadLimit()
        cursor._touch()
      }
    }

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [value, 32]
  }

  // If the length of the array is known in advance,
  // and the length of an element deeply nested in the array is not known,
  // we need to decode the offset of the array data.
  if (hasDynamicChild(param)) {
    // Dealing with dynamic types, so get the offset of the array data.
    const offset = toOffset(cursor.readBytes(sizeOfOffset))

    // Start is the static position of current slot + offset.
    const start = staticPosition + offset

    const value: unknown[] = []
    for (let i = 0; i < length; ++i) {
      // Move cursor along to the next slot (next offset pointer).
      cursor.setPosition(start + i * 32)
      const [data] = decodeParameter(cursor, param, {
        checksumAddress,
        staticPosition: start,
      })
      value.push(data)
    }

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [value, 32]
  }

  // If the length of the array is known in advance and the array is deeply static,
  // then we can just decode each element in sequence.
  let consumed = 0
  const value: unknown[] = []
  for (let i = 0; i < length; ++i) {
    const [data, consumed_] = decodeParameter(cursor, param, {
      checksumAddress,
      staticPosition: staticPosition + consumed,
    })
    consumed += consumed_
    value.push(data)
    // Charge zero-width elements against the read limit to bound work
    // on huge lengths of zero-width types (e.g. `uint256[0][4294967295]`).
    if (consumed_ === 0) {
      cursor.assertReadLimit()
      cursor._touch()
    }
  }
  return [value, consumed]
}

export declare namespace decodeArray {
  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
export function decodeBool(cursor: Cursor.Cursor) {
  return [Bytes.toBoolean(cursor.readBytes(32), { size: 32 }), 32]
}

export declare namespace decodeBool {
  type ErrorType = Bytes.toBoolean.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function decodeBytes(
  cursor: Cursor.Cursor,
  param: AbiParameters.Parameter,
  { staticPosition }: { staticPosition: number },
) {
  const [_, size] = param.type.split('bytes')
  if (!size) {
    // Dealing with dynamic types, so get the offset of the bytes data.
    const offset = toOffset(cursor.readBytes(32))

    // Set position of the cursor to start of bytes data.
    cursor.setPosition(staticPosition + offset)

    const length = toOffset(cursor.readBytes(32))

    // If there is no length, we have zero data.
    if (length === 0) {
      // As we have gone wondering, restore to the original position + next slot.
      cursor.setPosition(staticPosition + 32)
      return ['0x', 32]
    }

    const data = cursor.readBytes(length)

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [Hex.fromBytes(data), 32]
  }

  // Read the whole slot so that a slot cut short of its padding is out of bounds.
  const word = cursor.readBytes(32)
  const size_ = Number.parseInt(size, 10)
  // The value occupies the high `size` bytes of the word; the rest must be
  // zero padding.
  for (let i = size_; i < 32; i++)
    if (word[i] !== 0)
      throw new AbiParameters.BytesSizeMismatchError({
        expectedSize: size_,
        value: Hex.fromBytes(word),
      })
  return [Hex.fromBytes(word.subarray(0, size_)), 32]
}

export declare namespace decodeBytes {
  type ErrorType =
    | AbiParameters.BytesSizeMismatchError
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function decodeNumber(
  cursor: Cursor.Cursor,
  param: AbiParameters.Parameter,
) {
  const { type } = param
  // `uint256` is the common case: skip parsing its sign and size.
  const signed = type !== 'uint256' && type.startsWith('int')
  const size =
    type === 'uint256'
      ? 256
      : Number.parseInt(type.split('int')[1] || '256', 10)
  const value = Bytes.toBigInt(cursor.readBytes(32), { signed })
  // The word must hold a value that fits the declared size (zero-padded for
  // unsigned, sign-extended for signed types).
  if (size < 256) {
    const max = (1n << BigInt(signed ? size - 1 : size)) - 1n
    const min = signed ? -max - 1n : 0n
    if (value > max || value < min)
      throw new Hex.IntegerOutOfRangeError({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size / 8,
        value: value.toString(),
      })
  }
  return [size > 48 ? value : Number(value), 32]
}

export declare namespace decodeNumber {
  type ErrorType =
    | Bytes.toBigInt.ErrorType
    | Hex.IntegerOutOfRangeError
    | Errors.GlobalErrorType
}

/** @internal */
export type TupleAbiParameter = AbiParameters.Parameter & {
  components: readonly AbiParameters.Parameter[]
}

/** @internal */
export function decodeTuple(
  cursor: Cursor.Cursor,
  param: TupleAbiParameter,
  options: { checksumAddress?: boolean | undefined; staticPosition: number },
) {
  const { checksumAddress, staticPosition } = options

  // Tuples can have unnamed components (i.e. they are arrays), so we must
  // determine whether the tuple is named or unnamed. In the case of a named
  // tuple, the value will be an object where each property is the name of the
  // component. In the case of an unnamed tuple, the value will be an array.
  const hasUnnamedChild =
    param.components.length === 0 || param.components.some(({ name }) => !name)

  // Initialize the value to an object or an array, depending on whether the
  // tuple is named or unnamed.
  const value: any = hasUnnamedChild ? [] : {}
  let consumed = 0

  // If the tuple has a dynamic child, we must first decode the offset to the
  // tuple data.
  if (hasDynamicChild(param)) {
    // Dealing with dynamic types, so get the offset of the tuple data.
    const offset = toOffset(cursor.readBytes(sizeOfOffset))

    // Start is the static position of referencing slot + offset.
    const start = staticPosition + offset

    for (let i = 0; i < param.components.length; ++i) {
      const component = param.components[i]!
      cursor.setPosition(start + consumed)
      const [data, consumed_] = decodeParameter(cursor, component, {
        checksumAddress,
        staticPosition: start,
      })
      consumed += consumed_
      value[hasUnnamedChild ? i : component?.name!] = data
    }

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [value, 32]
  }

  // If the tuple has static children, we can just decode each component
  // in sequence.
  for (let i = 0; i < param.components.length; ++i) {
    const component = param.components[i]!
    const [data, consumed_] = decodeParameter(cursor, component, {
      checksumAddress,
      staticPosition,
    })
    value[hasUnnamedChild ? i : component?.name!] = data
    consumed += consumed_
  }
  return [value, consumed]
}

export declare namespace decodeTuple {
  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
export function decodeString(
  cursor: Cursor.Cursor,
  { staticPosition }: { staticPosition: number },
) {
  // Get offset to start of string data.
  const offset = toOffset(cursor.readBytes(32))

  // Start is the static position of current slot + offset.
  const start = staticPosition + offset
  cursor.setPosition(start)

  const length = toOffset(cursor.readBytes(32))

  // If there is no length, we have zero data (empty string).
  if (length === 0) {
    cursor.setPosition(staticPosition + 32)
    return ['', 32]
  }

  const data = cursor.readBytes(length, 32)
  const value = Bytes.toString(Bytes.trimLeft(data))

  // As we have gone wondering, restore to the original position + next slot.
  cursor.setPosition(staticPosition + 32)

  return [value, 32]
}

export declare namespace decodeString {
  type ErrorType =
    | Bytes.toString.ErrorType
    | Bytes.trimLeft.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function prepareParameters<
  const parameters extends AbiParameters.AbiParameters,
>({
  checksumAddress,
  parameters,
  values,
}: {
  checksumAddress?: boolean | undefined
  parameters: parameters
  values: parameters extends AbiParameters.AbiParameters
    ? ToPrimitiveTypes<parameters>
    : never
}) {
  const preparedParameters: PreparedParameter[] = []
  for (let i = 0; i < parameters.length; i++)
    preparedParameters.push(
      prepareParameter(parameters[i]!, values[i], checksumAddress),
    )
  return preparedParameters
}

/** @internal */
export declare namespace prepareParameters {
  type ErrorType = prepareParameter.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function prepareParameter(
  parameter: AbiParameters.Parameter,
  value: unknown,
  checksumAddress = false,
): PreparedParameter {
  const arrayComponents = getArrayComponents(parameter.type)
  if (arrayComponents) {
    const [length, type] = arrayComponents
    return encodeArray(value as never, {
      checksumAddress,
      length,
      parameter: {
        ...parameter,
        type,
      },
    })
  }
  if (parameter.type === 'tuple') {
    return encodeTuple(value as Tuple, {
      checksumAddress,
      parameter: parameter as TupleAbiParameter,
    })
  }
  if (parameter.type === 'address') {
    return encodeAddress(value as Hex.Hex, {
      checksum: checksumAddress,
    })
  }
  if (parameter.type === 'bool') {
    return encodeBoolean(value as boolean)
  }
  if (parameter.type.startsWith('uint') || parameter.type.startsWith('int')) {
    const signed = parameter.type.startsWith('int')
    const size =
      parameter.type === 'uint256' || parameter.type === 'int256'
        ? 256
        : Number((integerRegex.exec(parameter.type) ?? [])[2] ?? 256)
    return encodeNumber(value as number, { signed, size })
  }
  if (parameter.type.startsWith('bytes')) {
    return encodeBytes(value as Hex.Hex, { type: parameter.type })
  }
  if (parameter.type === 'string') {
    return encodeString(value as string)
  }
  throw new AbiParameters.InvalidTypeError(parameter.type)
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
    | AbiParameters.InvalidTypeError
    | Errors.GlobalErrorType
}

/** @internal */
export function encode(preparedParameters: PreparedParameter[]): string {
  // The static part holds each static parameter, and an offset into the
  // dynamic part for each dynamic one.
  let staticSize = 0
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i]!
    staticSize += dynamic ? 32 : encoded.length / 2
  }

  let staticPart = ''
  let dynamicPart = ''
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i]!
    if (dynamic) {
      staticPart += word(staticSize + dynamicPart.length / 2)
      dynamicPart += encoded
    } else staticPart += encoded
  }
  return staticPart + dynamicPart
}

/** @internal */
export declare namespace encode {
  type ErrorType =
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeAddress(
  value: Hex.Hex,
  options: { checksum: boolean },
): PreparedParameter {
  const { checksum = false } = options
  // `Address.assert` throws for an invalid address, and checks a checksum.
  const kind = internal_address.classify(value)
  if (kind === 0 || (checksum && kind === 2))
    Address.assert(value, { strict: checksum })
  return {
    dynamic: false,
    encoded: `000000000000000000000000${kind === 2 ? value.slice(2).toLowerCase() : value.slice(2)}`,
  }
}

/** @internal */
export declare namespace encodeAddress {
  type ErrorType =
    | Address.assert.ErrorType
    | Hex.padLeft.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeArray<const parameter extends AbiParameters.Parameter>(
  value: ParameterToPrimitiveType<parameter>,
  options: {
    checksumAddress?: boolean | undefined
    length: number | null
    parameter: parameter
  },
): PreparedParameter {
  const { checksumAddress, length, parameter } = options

  const dynamic = length === null

  if (!Array.isArray(value)) throw new AbiParameters.InvalidArrayError(value)
  if (!dynamic && value.length !== length)
    throw new AbiParameters.ArrayLengthMismatchError({
      expectedLength: length!,
      givenLength: value.length,
      type: `${parameter.type}[${length}]`,
    })

  // Zero-length fixed arrays of dynamic types (e.g. `string[0]`) are dynamic
  // per the ABI spec, even though they have no elements to inspect.
  let dynamicChild = value.length === 0 && hasDynamicChild(parameter)
  const preparedParameters: PreparedParameter[] = []
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParameter(parameter, value[i], checksumAddress)
    if (preparedParam.dynamic) dynamicChild = true
    preparedParameters.push(preparedParam)
  }

  if (dynamic || dynamicChild) {
    const data = encode(preparedParameters)
    if (dynamic)
      return { dynamic: true, encoded: word(preparedParameters.length) + data }
    return { dynamic: true, encoded: data }
  }
  return { dynamic: false, encoded: concat(preparedParameters) }
}

/** @internal */
export declare namespace encodeArray {
  type ErrorType =
    | AbiParameters.InvalidArrayError
    | AbiParameters.ArrayLengthMismatchError
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeBytes(
  value: Hex.Hex,
  { type }: { type: string },
): PreparedParameter {
  const [, parametersize] = type.split('bytes')
  const bytesSize = Hex.size(value)
  if (!parametersize) {
    // An unpaired nibble has no byte to belong to, so reject it instead of
    // guessing which half of a byte it is.
    if (value.length % 2 !== 0) throw new Hex.InvalidLengthError(value)
    let value_ = value
    // If the size is not divisible by 32 bytes, pad the end
    // with empty bytes to the ceiling 32 bytes.
    if (bytesSize % 32 !== 0)
      value_ = Hex.padRight(value_, Math.ceil((value.length - 2) / 2 / 32) * 32)
    return {
      dynamic: true,
      encoded: Hex.concat(
        Hex.padLeft(Hex.fromNumber(bytesSize, { size: 32 })),
        value_,
      ).slice(2),
    }
  }
  if (bytesSize !== Number.parseInt(parametersize, 10))
    throw new AbiParameters.BytesSizeMismatchError({
      expectedSize: Number.parseInt(parametersize, 10),
      value,
    })
  if (value.length % 2 !== 0) throw new Hex.InvalidLengthError(value)
  return { dynamic: false, encoded: Hex.padRight(value).slice(2) }
}

/** @internal */
export declare namespace encodeBytes {
  type ErrorType =
    | Hex.InvalidLengthError
    | Hex.padLeft.ErrorType
    | Hex.padRight.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeBoolean(value: boolean): PreparedParameter {
  if (typeof value !== 'boolean')
    throw new Errors.BaseError(
      `Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`,
    )
  return { dynamic: false, encoded: word(value ? 1 : 0) }
}

/** @internal */
export declare namespace encodeBoolean {
  type ErrorType =
    | Hex.padLeft.ErrorType
    | Hex.fromBoolean.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeNumber(
  value: number,
  { signed, size }: { signed: boolean; size: number },
): PreparedParameter {
  if (typeof size === 'number') {
    const [max, min] = getIntegerBounds(signed, size)
    if (value > max || value < min)
      throw new Hex.IntegerOutOfRangeError({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size / 8,
        value: value.toString(),
      })
  }
  // A word is 32 bytes, and a negative value its two's complement, whatever
  // the type's size.
  const value_ = BigInt(value)
  return {
    dynamic: false,
    encoded: word(value_ < 0n ? BigInt.asUintN(256, value_) : value_),
  }
}

/** @internal */
export declare namespace encodeNumber {
  type ErrorType = Hex.fromNumber.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function encodeString(value: string): PreparedParameter {
  // The length, then the UTF-8 bytes, padded to whole words.
  const hex = Hex.fromString(value).slice(2)
  return {
    dynamic: true,
    encoded:
      word(hex.length / 2) + hex.padEnd(Math.ceil(hex.length / 64) * 64, '0'),
  }
}

/** @internal */
export declare namespace encodeString {
  type ErrorType =
    | Hex.fromNumber.ErrorType
    | Hex.padRight.ErrorType
    | Hex.slice.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeTuple<
  const parameter extends AbiParameters.Parameter & {
    components: readonly AbiParameters.Parameter[]
  },
>(
  value: ParameterToPrimitiveType<parameter>,
  options: {
    checksumAddress?: boolean | undefined
    parameter: parameter
  },
): PreparedParameter {
  const { checksumAddress, parameter } = options

  let dynamic = false
  const preparedParameters: PreparedParameter[] = []
  for (let i = 0; i < parameter.components.length; i++) {
    const param_ = parameter.components[i]!
    const index = Array.isArray(value) ? i : param_.name
    const preparedParam = prepareParameter(
      param_,
      (value as any)[index!],
      checksumAddress,
    )
    preparedParameters.push(preparedParam)
    if (preparedParam.dynamic) dynamic = true
  }
  return {
    dynamic,
    encoded: dynamic ? encode(preparedParameters) : concat(preparedParameters),
  }
}

/** @internal */
export declare namespace encodeTuple {
  type ErrorType = Hex.concat.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function getArrayComponents(
  type: string,
): [length: number | null, innerType: string] | undefined {
  // Only array types end with `]`, so skip the regex for every other type.
  if (type.charCodeAt(type.length - 1) !== 93) return undefined
  const matches = type.match(arrayRegex)
  return matches
    ? // Return `null` if the array is dynamic.
      [matches[2]! ? Number(matches[2]!) : null, matches[1]!]
    : undefined
}

/** @internal */
export function hasDynamicChild(param: AbiParameters.Parameter) {
  const { type } = param
  if (type === 'string') return true
  if (type === 'bytes') return true
  if (type.endsWith('[]')) return true

  if (type === 'tuple') return (param as any).components?.some(hasDynamicChild)

  const arrayComponents = getArrayComponents(param.type)
  if (
    arrayComponents &&
    hasDynamicChild({
      ...param,
      type: arrayComponents[1],
    } as AbiParameters.Parameter)
  )
    return true

  return false
}

/** @internal */
function getIntegerBounds(signed: boolean, size: number) {
  const key = size * 2 + (signed ? 1 : 0)
  let bounds = integerBounds.get(key)
  if (!bounds) {
    const max = 2n ** (BigInt(size) - (signed ? 1n : 0n)) - 1n
    bounds = [max, signed ? -max - 1n : 0n]
    integerBounds.set(key, bounds)
  }
  return bounds
}

/**
 * Concatenates the encodings of static parameters.
 *
 * @internal
 */
function concat(preparedParameters: readonly PreparedParameter[]): string {
  let encoded = ''
  for (let i = 0; i < preparedParameters.length; i++)
    encoded += preparedParameters[i]!.encoded
  return encoded
}

/**
 * A word: a non-negative value of up to 32 bytes as 64 hex digits.
 *
 * @internal
 */
function word(value: number | bigint): string {
  const hex = value.toString(16)
  return zeros.slice(hex.length) + hex
}

const zeros = '0000000000000000000000000000000000000000000000000000000000000000'

/**
 * Reads an offset or length word as a number. Like `Bytes.toNumber` before it
 * checked for safe integers, values above 6 bytes stay lossy, so that the
 * cursor reports them as out of bounds.
 *
 * @internal
 */
function toOffset(word: Bytes.Bytes): number {
  let i = 0
  while (i < 26 && word[i] === 0) i++
  if (i < 26) return Number(Hex.fromBytes(word))
  let value = 0
  for (; i < 32; i++) value = value * 256 + word[i]!
  return value
}
