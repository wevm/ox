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
import { encoder } from './codec/utf8.js'
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

type MeasureContext = {
  checksumAddress: boolean
}

type HexPatch = {
  offset: number
  value: string
}

type WriteContext = {
  bytes: Bytes.Bytes
  patches: HexPatch[]
  view: DataView
}

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

/** @internal */
export type ToPrimitiveTypes<
  abiParameters extends readonly AbiParameter[],
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = AbiParametersToPrimitiveTypes<abiParameters, abiParameterKind>

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
  const wrap = (address: Hex.Hex) =>
    checksum ? Address.checksum(address) : address
  return [wrap(Hex.fromBytes(Bytes.slice(value, -20))), 32]
}

export declare namespace decodeAddress {
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Bytes.slice.ErrorType
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
    const offset = Bytes.toNumber(cursor.readBytes(sizeOfOffset))

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
    // Zero-length arrays of dynamic types (e.g. `string[0]`) have no tail, so
    // the next slot may sit past the end of the data.
    if (staticPosition + 32 < cursor.bytes.length)
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

  const value = Hex.fromBytes(cursor.readBytes(Number.parseInt(size, 10), 32))
  return [value, 32]
}

export declare namespace decodeBytes {
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Bytes.toNumber.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function decodeNumber(
  cursor: Cursor.Cursor,
  param: AbiParameters.Parameter,
) {
  const signed = param.type.startsWith('int')
  const size = Number.parseInt(param.type.split('int')[1] || '256', 10)
  const value = cursor.readBytes(32)
  return [
    size > 48
      ? Bytes.toBigInt(value, { signed })
      : Bytes.toNumber(value, { signed }),
    32,
  ]
}

export declare namespace decodeNumber {
  type ErrorType =
    | Bytes.toNumber.ErrorType
    | Bytes.toBigInt.ErrorType
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
  const context: MeasureContext = {
    checksumAddress,
  }
  const size = measureParameters(compiled, values, context)

  const prefixSize = prefix ? Hex.size(prefix) : 0
  const bytes = new Uint8Array(prefixSize + size)
  const writer: WriteContext = {
    bytes,
    patches: [],
    view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
  }

  if (prefix) writeHex(writer, 0, prefix)
  writeParameters(writer, prefixSize, compiled, values)

  let data = Hex.fromBytes(bytes)
  for (let i = 0; i < writer.patches.length; i++) {
    const patch = writer.patches[i]!
    const start = 2 + patch.offset * 2
    data =
      `${data.slice(0, start)}${patch.value}${data.slice(start + patch.value.length)}` as Hex.Hex
  }
  return data
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
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

function compileParameters(
  parameters: readonly AbiParameters.Parameter[],
): readonly CompiledParameter[] {
  const compiled: CompiledParameter[] = []
  for (let i = 0; i < parameters.length; i++)
    compiled.push(compileParameter(parameters[i]!))
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
    const [, , size = '256'] = integerRegex.exec(parameter.type) ?? []
    const size_ = Number(size)
    const max = 2n ** (BigInt(size_) - (signed ? 1n : 0n)) - 1n
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
  context: MeasureContext,
): number {
  let size = getHeadSize(parameters)
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i]!
    const parameterSize = measureParameter(
      parameter,
      getParameterValue(parameter, values, i),
      context,
    )
    if (parameter.dynamic) size += parameterSize
  }
  return size
}

function measureParameter(
  parameter: CompiledParameter,
  value: unknown,
  context: MeasureContext,
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
      const childSize = measureParameter(parameter.child, value[i], context)
      if (parameter.child.dynamic) size += childSize
    }
    return size
  }

  if (parameter.kind === 'tuple')
    return measureParameters(parameter.children, value as object, context)

  if (parameter.kind === 'address') {
    Address.assert(value as Address.Address, {
      strict: context.checksumAddress,
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

function isWritableHex(value: Hex.Hex): boolean {
  if (
    typeof value !== 'string' ||
    value.charCodeAt(0) !== 48 ||
    value.charCodeAt(1) !== 120
  )
    return false
  for (let i = 2; i < value.length; i++)
    if (toNibble(value.charCodeAt(i)) === -1) return false
  return true
}

function writeParameters(
  context: WriteContext,
  offset: number,
  parameters: readonly CompiledParameter[],
  values: readonly unknown[] | object,
): number {
  let head = offset
  let tail = offset + getHeadSize(parameters)
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i]!
    const value = getParameterValue(parameter, values, i)
    if (parameter.dynamic) {
      writeWord(context, head, tail - offset)
      head += 32
      tail = writeParameter(context, tail, parameter, value)
    } else head = writeParameter(context, head, parameter, value)
  }
  return Math.max(head, tail)
}

function writeParameter(
  context: WriteContext,
  offset: number,
  parameter: CompiledParameter,
  value: unknown,
): number {
  if (parameter.kind === 'array') {
    const values = value as readonly unknown[]
    let head = offset
    if (parameter.length === null) {
      writeWord(context, head, values.length)
      head += 32
    }

    let tail =
      head +
      values.length *
        (parameter.child.dynamic ? 32 : parameter.child.staticSize)
    for (let i = 0; i < values.length; i++) {
      if (parameter.child.dynamic) {
        writeWord(
          context,
          head,
          tail - (parameter.length === null ? offset + 32 : offset),
        )
        head += 32
        tail = writeParameter(context, tail, parameter.child, values[i])
      } else head = writeParameter(context, head, parameter.child, values[i])
    }
    return Math.max(head, tail)
  }

  if (parameter.kind === 'tuple')
    return writeParameters(context, offset, parameter.children, value as object)

  if (parameter.kind === 'address') {
    writeHex(context, offset + 12, value as Hex.Hex)
    return offset + 32
  }

  if (parameter.kind === 'boolean') {
    context.bytes[offset + 31] = value ? 1 : 0
    return offset + 32
  }

  if (parameter.kind === 'integer') {
    writeWord(context, offset, value as number)
    return offset + 32
  }

  if (parameter.kind === 'bytes') {
    const value_ = value as Hex.Hex
    if (parameter.size === null) {
      const size = Hex.size(value_)
      writeWord(context, offset, size)
      writeHex(context, offset + 32, value_)
      return offset + 32 + Math.ceil(size / 32) * 32
    }
    writeHex(context, offset, value_)
    return offset + 32
  }

  if (parameter.kind === 'string') {
    const value_ = normalizeString(value)
    const size = getUtf8Size(value_)
    writeWord(context, offset, size)
    const { written } = encoder.encodeInto(
      value_,
      context.bytes.subarray(offset + 32, offset + 32 + size),
    )
    if (written !== size) throw new Error('Failed to encode string.')
    return offset + 32 + Math.ceil(size / 32) * 32
  }

  return offset
}

function writeHex(
  context: WriteContext,
  offset: number,
  value: Hex.Hex,
): number {
  if (!isWritableHex(value)) {
    const patch = value.slice(2)
    context.patches.push({ offset, value: patch })
    return offset + Math.ceil(patch.length / 2)
  }

  let i = 2
  for (; i + 1 < value.length; i += 2)
    context.bytes[offset++] =
      (toNibble(value.charCodeAt(i)) << 4) | toNibble(value.charCodeAt(i + 1))
  if (i < value.length)
    context.bytes[offset++] = toNibble(value.charCodeAt(i)) << 4
  return offset
}

function writeWord(
  context: WriteContext,
  offset: number,
  value: bigint | number,
) {
  let value_ = BigInt(value)
  if (value_ < 0n) value_ = BigInt.asUintN(256, value_)

  // DataView avoids 32 BigInt shifts for the common word-sized case.
  if (value_ <= 0xffff_ffff_ffff_ffffn) {
    context.view.setBigUint64(offset + 24, value_)
    return
  }

  const hex = value_.toString(16)
  let cursor = offset + 32 - Math.ceil(hex.length / 2)
  let i = hex.length % 2
  if (i === 1) context.bytes[cursor++] = toNibble(hex.charCodeAt(0))
  for (; i < hex.length; i += 2)
    context.bytes[cursor++] =
      (toNibble(hex.charCodeAt(i)) << 4) | toNibble(hex.charCodeAt(i + 1))
}

function toNibble(code: number): number {
  if (code >= 48 && code <= 57) return code - 48
  if (code >= 65 && code <= 70) return code - 55
  if (code >= 97 && code <= 102) return code - 87
  return -1
}

/** @internal */
export function getArrayComponents(
  type: string,
): [length: number | null, innerType: string] | undefined {
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
