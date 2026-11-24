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
import { bytesRegex, integerRegex, maxInt256, maxUint256 } from '../Solidity.js'
import { nibbleTable } from './codec/hex.js'
import * as utf8 from './codec/utf8.js'
import type * as Cursor from './cursor.js'
import type { Compute, IsNarrowable, UnionToIntersection } from './types.js'

/** @internal */
export type ParameterToPrimitiveType<
  abiParameter extends AbiParameter | { name: string; type: unknown },
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = AbiParameterToPrimitiveType<abiParameter, abiParameterKind>

type CompiledParameterBase = {
  dynamic: boolean
  name: string | undefined
  staticSize: number
}

type CompiledArray = CompiledParameterBase & {
  child: CompiledParameter
  kind: 'array'
  length: number | null
  type: string
}

type CompiledBytes = CompiledParameterBase & {
  kind: 'bytes'
  size: number | null
}

type CompiledInteger = CompiledParameterBase & {
  kind: 'integer'
  max: bigint
  min: bigint
  signed: boolean
  size: number
}

type CompiledTuple = CompiledParameterBase & {
  children: readonly CompiledParameter[]
  kind: 'tuple'
}

type CompiledParameter =
  | CompiledArray
  | CompiledBytes
  | CompiledInteger
  | CompiledTuple
  | (CompiledParameterBase & {
      kind: 'address' | 'boolean' | 'invalid' | 'string'
      type?: string | undefined
    })

/** @internal */
export type ToObject<
  parameters extends readonly AbiParameter[],
  kind extends AbiParameterKind = AbiParameterKind,
> =
  IsNarrowable<parameters, AbiParameters.AbiParameters> extends true
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

/**
 * Cached regex for matching array suffixes (e.g. `uint256[]`,
 * `bytes32[3]`). Hoisted to module scope so we don't allocate a new
 * regex per `getArrayComponents` call (hot in encode/decode).
 *
 * @internal
 */
const arraySuffixRegex = /^(.*)\[(\d+)?\]$/

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
  // Sliced from the word's hex: a view of a word of up to 64 bytes would make
  // V8 move it to an ArrayBuffer first.
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
    const offset = Bytes.toNumber(cursor.readBytes(sizeOfOffset))

    // Start is the static position of current slot + offset.
    const start = staticPosition + offset
    const startOfData = start + sizeOfLength

    // Get the length of the array from the offset.
    cursor.setPosition(start)
    const length = Bytes.toNumber(cursor.readBytes(sizeOfLength))

    // Check if the array has any dynamic children.
    const dynamicChild = hasDynamicChild(param)
    const decode = getDecoder(param, checksumAddress)

    let consumed = 0
    const value: unknown[] = []
    for (let i = 0; i < length; ++i) {
      // If any of the children is dynamic, then all elements will be offset pointer, thus size of one slot (32 bytes).
      // Otherwise, elements will be the size of their encoding (consumed bytes).
      cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed))
      const [data, consumed_] = decode(cursor, startOfData)
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
    const offset = Bytes.toNumber(cursor.readBytes(sizeOfOffset))

    // Start is the static position of current slot + offset.
    const start = staticPosition + offset

    const decode = getDecoder(param, checksumAddress)
    const value: unknown[] = []
    for (let i = 0; i < length; ++i) {
      // Move cursor along to the next slot (next offset pointer).
      cursor.setPosition(start + i * 32)
      const [data] = decode(cursor, start)
      value.push(data)
    }

    // As we have gone wondering, restore to the original position + next slot.
    // Zero-length arrays of dynamic types (e.g. `string[0]`) have no tail, so
    // the next slot may sit past the end of the data.
    if (staticPosition + 32 < cursor.bytes.length)
      cursor.setPosition(staticPosition + 32)
    return [value, 32]
  }

  // If the length of the array is known in advance and the array is deeply static,
  // then we can just decode each element in sequence.
  const decode = getDecoder(param, checksumAddress)
  let consumed = 0
  const value: unknown[] = []
  for (let i = 0; i < length; ++i) {
    const [data, consumed_] = decode(cursor, staticPosition + consumed)
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
  type ErrorType = Bytes.toNumber.ErrorType | Errors.GlobalErrorType
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
    const offset = Bytes.toNumber(cursor.readBytes(32))

    // Set position of the cursor to start of bytes data.
    cursor.setPosition(staticPosition + offset)

    const length = Bytes.toNumber(cursor.readBytes(32))

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
    | Bytes.toNumber.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function decodeNumber(
  cursor: Cursor.Cursor,
  param: AbiParameters.Parameter,
) {
  return decodeInteger(cursor, getInteger(param.type))
}

export declare namespace decodeNumber {
  type ErrorType =
    | Bytes.toBigInt.ErrorType
    | Hex.IntegerOutOfRangeError
    | Errors.GlobalErrorType
}

type Integer = {
  max: bigint
  min: bigint
  signed: boolean
  size: number
}

/** Parses an integer type and its bounds, once per type rather than per value. */
function getInteger(type: string): Integer {
  const signed = type.startsWith('int')
  const size = Number.parseInt(type.split('int')[1] || '256', 10)
  if (!(size < 256)) return { max: 0n, min: 0n, signed, size }
  const max = (1n << BigInt(signed ? size - 1 : size)) - 1n
  return { max, min: signed ? -max - 1n : 0n, signed, size }
}

function decodeInteger(cursor: Cursor.Cursor, integer: Integer) {
  const { max, min, signed, size } = integer
  const value = Bytes.toBigInt(cursor.readBytes(32), { signed })
  // The word must hold a value that fits the declared size (zero-padded for
  // unsigned, sign-extended for signed types).
  if (size < 256 && (value > max || value < min))
    throw new Hex.IntegerOutOfRangeError({
      max: max.toString(),
      min: min.toString(),
      signed,
      size: size / 8,
      value: value.toString(),
    })
  return [size > 48 ? value : Number(value), 32]
}

/**
 * Resolves how to decode a parameter once, so that the elements of an array
 * do not each re-parse its type. Types other than `address`, `bool` and
 * integers go through `decodeParameter`.
 */
function getDecoder(
  param: AbiParameters.Parameter,
  checksumAddress: boolean | undefined,
): (
  cursor: Cursor.Cursor,
  staticPosition: number,
) => ReturnType<typeof decodeParameter> {
  const { type } = param
  if (type === 'address')
    return (cursor) => decodeAddress(cursor, { checksum: checksumAddress })
  if (type === 'bool') return decodeBool
  if (
    (type.startsWith('uint') || type.startsWith('int')) &&
    !getArrayComponents(type)
  ) {
    const integer = getInteger(type)
    return (cursor) => decodeInteger(cursor, integer)
  }
  return (cursor, staticPosition) =>
    decodeParameter(cursor, param, { checksumAddress, staticPosition })
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
    const offset = Bytes.toNumber(cursor.readBytes(sizeOfOffset))

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
      value[hasUnnamedChild ? i : component.name!] = data
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
    value[hasUnnamedChild ? i : component.name!] = data
    consumed += consumed_
  }
  return [value, consumed]
}

export declare namespace decodeTuple {
  type ErrorType = Bytes.toNumber.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function decodeString(
  cursor: Cursor.Cursor,
  { staticPosition }: { staticPosition: number },
) {
  // Get offset to start of string data.
  const offset = Bytes.toNumber(cursor.readBytes(32))

  // Start is the static position of current slot + offset.
  const start = staticPosition + offset
  cursor.setPosition(start)

  const length = Bytes.toNumber(cursor.readBytes(32))

  // If there is no length, we have zero data (empty string).
  if (length === 0) {
    cursor.setPosition(staticPosition + 32)
    return ['', 32]
  }

  const data = cursor.readBytes(length, 32)
  const value = Bytes.toString(data)

  // As we have gone wondering, restore to the original position + next slot.
  cursor.setPosition(staticPosition + 32)

  return [value, 32]
}

export declare namespace decodeString {
  type ErrorType =
    | Bytes.toNumber.ErrorType
    | Bytes.toString.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function encodeParameters(
  parameters: readonly AbiParameters.Parameter[],
  values: readonly unknown[],
  options: encodeParameters.Options = {},
): Hex.Hex {
  const { checksumAddress = false, prefix } = options

  if (parameters.length !== values.length)
    throw new AbiParameters.LengthMismatchError({
      expectedLength: parameters.length,
      givenLength: values.length,
    })

  // Compile the wire shape before walking values so recursive writes only
  // handle offsets and data.
  const compiled = compileParameters(parameters)
  measureParameters(compiled, values, checksumAddress)

  // The measure pass validated every value, so the encoding is built as one
  // string of hex digits: no buffer to allocate, and no bytes to hex-encode.
  return `${prefix ?? '0x'}${encodeList(compiled, values)}` as Hex.Hex
}

export declare namespace encodeParameters {
  type Options = {
    checksumAddress?: boolean | undefined
    prefix?: Hex.Hex | undefined
  }

  type ErrorType =
    | AbiParameters.LengthMismatchError
    | AbiParameters.InvalidArrayError
    | AbiParameters.ArrayLengthMismatchError
    | AbiParameters.BytesSizeMismatchError
    | AbiParameters.InvalidTypeError
    | Address.assert.ErrorType
    | Hex.IntegerOutOfRangeError
    | Hex.InvalidHexValueError
    | Hex.InvalidLengthError
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

function compileParameters(
  parameters: readonly AbiParameters.Parameter[],
): readonly CompiledParameter[] {
  // Sized up front: an empty array grows a 17-slot backing store on its first push.
  const compiled: CompiledParameter[] = new Array(parameters.length)
  for (let i = 0; i < parameters.length; i++)
    compiled[i] = compileParameter(parameters[i]!)
  return compiled
}

function compileParameter(
  parameter: AbiParameters.Parameter,
): CompiledParameter {
  const name = parameter.name
  const array = getArrayComponents(parameter.type)
  if (array) {
    const [length, type] = array
    const child = compileParameter({ ...parameter, type })
    const dynamic = length === null || child.dynamic
    return {
      child,
      dynamic,
      kind: 'array',
      length,
      name,
      staticSize: dynamic ? 32 : child.staticSize * length,
      type: parameter.type,
    }
  }

  if (parameter.type === 'tuple') {
    const children = compileParameters(
      (parameter as TupleAbiParameter).components,
    )
    let dynamic = false
    let staticSize = 0
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!
      if (child.dynamic) dynamic = true
      staticSize += child.staticSize
    }
    return {
      children,
      dynamic,
      kind: 'tuple',
      name,
      staticSize: dynamic ? 32 : staticSize,
    }
  }

  if (parameter.type === 'address')
    return {
      dynamic: false,
      kind: 'address',
      name,
      staticSize: 32,
    }

  if (parameter.type === 'bool')
    return {
      dynamic: false,
      kind: 'boolean',
      name,
      staticSize: 32,
    }

  if (parameter.type.startsWith('uint') || parameter.type.startsWith('int')) {
    const signed = parameter.type.startsWith('int')
    // `uint256` and `int256` are the common types: skip the regex and the
    // BigInt arithmetic for them.
    const size_ =
      parameter.type === 'uint256' || parameter.type === 'int256'
        ? 256
        : Number((integerRegex.exec(parameter.type) ?? [])[2] ?? 256)
    const max =
      size_ === 256
        ? signed
          ? maxInt256
          : maxUint256
        : (1n << BigInt(signed ? size_ - 1 : size_)) - 1n
    return {
      dynamic: false,
      kind: 'integer',
      max,
      min: signed ? -max - 1n : 0n,
      name,
      signed,
      size: size_,
      staticSize: 32,
    }
  }

  if (parameter.type.startsWith('bytes')) {
    if (!bytesRegex.test(parameter.type))
      throw new AbiParameters.InvalidTypeError(parameter.type)
    const [, size] = parameter.type.split('bytes')
    return {
      dynamic: !size,
      kind: 'bytes',
      name,
      size: size ? Number.parseInt(size, 10) : null,
      staticSize: 32,
    }
  }

  if (parameter.type === 'string')
    return {
      dynamic: true,
      kind: 'string',
      name,
      staticSize: 32,
    }

  return {
    dynamic: false,
    kind: 'invalid',
    name,
    staticSize: 0,
    type: parameter.type,
  }
}

function measureParameters(
  parameters: readonly CompiledParameter[],
  values: readonly unknown[] | object,
  checksumAddress: boolean,
): number {
  let size = getHeadSize(parameters)
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i]!
    const parameterSize = measureParameter(
      parameter,
      getParameterValue(parameter, values, i),
      checksumAddress,
    )
    if (parameter.dynamic) size += parameterSize
  }
  return size
}

function measureParameter(
  parameter: CompiledParameter,
  value: unknown,
  checksumAddress: boolean,
): number {
  if (parameter.kind === 'array') {
    if (!Array.isArray(value)) throw new AbiParameters.InvalidArrayError(value)
    if (parameter.length !== null && value.length !== parameter.length)
      throw new AbiParameters.ArrayLengthMismatchError({
        expectedLength: parameter.length,
        givenLength: value.length,
        type: parameter.type,
      })

    let size = parameter.length === null ? 32 : 0
    size +=
      value.length * (parameter.child.dynamic ? 32 : parameter.child.staticSize)
    for (let i = 0; i < value.length; i++) {
      const childSize = measureParameter(
        parameter.child,
        value[i],
        checksumAddress,
      )
      if (parameter.child.dynamic) size += childSize
    }
    return size
  }

  if (parameter.kind === 'tuple')
    return measureParameters(
      parameter.children,
      value as object,
      checksumAddress,
    )

  if (parameter.kind === 'address') {
    Address.assert(value as Address.Address, {
      strict: checksumAddress,
    })
    return 32
  }

  if (parameter.kind === 'boolean') {
    if (typeof value !== 'boolean')
      throw new Errors.BaseError(
        `Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`,
      )
    return 32
  }

  if (parameter.kind === 'integer') {
    const value_ = value as number
    if (value_ > parameter.max || value_ < parameter.min)
      throw new Hex.IntegerOutOfRangeError({
        max: parameter.max.toString(),
        min: parameter.min.toString(),
        signed: parameter.signed,
        size: parameter.size / 8,
        value: value_.toString(),
      })
    BigInt(value_)
    return 32
  }

  if (parameter.kind === 'bytes') {
    const value_ = value as Hex.Hex
    const size = Hex.size(value_)
    if (parameter.size !== null && size !== parameter.size)
      throw new AbiParameters.BytesSizeMismatchError({
        expectedSize: parameter.size,
        value: value_,
      })
    // An unpaired nibble has no byte to belong to, so reject it instead of
    // guessing which half of a byte it is.
    if (value_.length % 2 !== 0) throw new Hex.InvalidLengthError(value_)
    if (parameter.size !== null) return 32
    return 32 + Math.ceil(size / 32) * 32
  }

  if (parameter.kind === 'string') {
    const size = getUtf8Size(normalizeString(value))
    return 32 + Math.ceil(size / 32) * 32
  }

  throw new AbiParameters.InvalidTypeError(parameter.type!)
}

function getHeadSize(parameters: readonly CompiledParameter[]): number {
  let size = 0
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i]!
    size += parameter.dynamic ? 32 : parameter.staticSize
  }
  return size
}

function getParameterValue(
  parameter: CompiledParameter,
  values: readonly unknown[] | object,
  index: number,
) {
  if (Array.isArray(values)) return values[index]
  return (values as Record<string, unknown>)[parameter.name!]
}

function getUtf8Size(value: string): number {
  let size = 0
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code < 0x80) size++
    else if (code < 0x800) size += 2
    else if (
      code >= 0xd800 &&
      code <= 0xdbff &&
      value.charCodeAt(i + 1) >= 0xdc00 &&
      value.charCodeAt(i + 1) <= 0xdfff
    ) {
      size += 4
      i++
    } else size += 3
  }
  return size
}

function normalizeString(value: unknown): string {
  if (value === undefined) return ''
  return `${value}`
}

function encodeList(
  parameters: readonly CompiledParameter[],
  values: readonly unknown[] | object,
): string {
  // The head holds each static parameter, and the offset of each dynamic one
  // into the tail, which follows the head.
  const headSize = getHeadSize(parameters)
  let head = ''
  let tail = ''
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i]!
    const value = getParameterValue(parameter, values, i)
    if (parameter.dynamic) {
      head += word(headSize + tail.length / 2)
      tail += encodeParameter(parameter, value)
    } else head += encodeParameter(parameter, value)
  }
  return head + tail
}

function encodeParameter(parameter: CompiledParameter, value: unknown): string {
  if (parameter.kind === 'array') {
    const values = value as readonly unknown[]
    const { child } = parameter
    const headSize = values.length * (child.dynamic ? 32 : child.staticSize)
    let head = parameter.length === null ? word(values.length) : ''
    let tail = ''
    for (let i = 0; i < values.length; i++) {
      if (child.dynamic) {
        head += word(headSize + tail.length / 2)
        tail += encodeParameter(child, values[i])
      } else head += encodeParameter(child, values[i])
    }
    return head + tail
  }

  if (parameter.kind === 'tuple')
    return encodeList(parameter.children, value as object)

  // The measure pass asserted the address, so `toLowerCase` only folds `A-F`,
  // and returns the address as is when it has none.
  if (parameter.kind === 'address')
    return `000000000000000000000000${(value as string).toLowerCase().slice(2)}`

  if (parameter.kind === 'boolean') return value ? word(1) : word(0)

  if (parameter.kind === 'integer') {
    // A value may also be a string or boolean, which `BigInt` converts.
    let value_ = typeof value === 'number' ? value : BigInt(value as bigint)
    if (value_ < 0) value_ = BigInt.asUintN(256, BigInt(value_))
    return word(value_)
  }

  if (parameter.kind === 'bytes') {
    const digits_ = digits(value as Hex.Hex)
    if (parameter.size === null)
      return word(digits_.length / 2) + padRight(digits_)
    return padRight(digits_)
  }

  if (parameter.kind === 'string') {
    const bytes = utf8.encode(normalizeString(value))
    return word(bytes.length) + padRight(Hex.fromBytes(bytes).slice(2))
  }

  return ''
}

/**
 * The lowercase hex digits of a hex string, without `0x`, as `Hex.fromBytes`
 * would print its bytes.
 */
function digits(value: Hex.Hex): string {
  if (
    typeof value !== 'string' ||
    value.charCodeAt(0) !== 48 ||
    value.charCodeAt(1) !== 120
  )
    throw new Hex.InvalidHexValueError(value)

  // A valid nibble is at most `0x0f`, so only the `0xff` sentinel sets bit 7.
  // `nibbleTable` only spans Latin-1, so a code unit above it reads `undefined`
  // and is mapped to the sentinel.
  const table = nibbleTable
  let invalid = 0
  let upper = false
  for (let i = 2; i < value.length; i++) {
    const code = value.charCodeAt(i)
    invalid |= table[code] ?? 0xff
    if (code < 97) upper ||= code > 64
  }
  if (invalid & 0x80) throw new Hex.InvalidHexValueError(value)
  return upper ? value.slice(2).toLowerCase() : value.slice(2)
}

const zeros = '0000000000000000000000000000000000000000000000000000000000000000'

/** A 32-byte word holding an unsigned integer, as 64 hex digits. */
function word(value: bigint | number): string {
  const digits_ = value.toString(16)
  return zeros.slice(digits_.length) + digits_
}

/** Pads hex digits on the right to a whole number of 32-byte words. */
function padRight(digits_: string): string {
  const remainder = digits_.length % 64
  return remainder === 0 ? digits_ : digits_ + zeros.slice(remainder)
}

/** @internal */
export function getArrayComponents(
  type: string,
): [length: number | null, innerType: string] | undefined {
  // Only a type ending in `]` can match, so skip the regex for the element
  // types (`uint256`, `address`, ...) that decoding checks once per value.
  if (type.charCodeAt(type.length - 1) !== 93 /* ] */) return undefined
  const matches = arraySuffixRegex.exec(type)
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
