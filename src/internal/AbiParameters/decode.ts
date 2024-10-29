import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { type Cursor, createCursor } from '../cursor.js'
import { getArrayComponents } from './encode.js'
import {
  AbiParameters_DataSizeTooSmallError,
  AbiParameters_InvalidTypeError,
  AbiParameters_ZeroDataError,
} from './errors.js'
import type {
  AbiParameters,
  AbiParameters_Parameter,
  AbiParameters_ToObject,
  AbiParameters_ToPrimitiveTypes,
} from './types.js'

export function AbiParameters_decode<
  const parameters extends AbiParameters,
  as extends 'Object' | 'Array' = 'Array',
>(
  parameters: parameters,
  data: Bytes.Bytes | Hex.Hex,
  options?: AbiParameters_decode.Options<as>,
): AbiParameters_decode.ReturnType<parameters, as>

/**
 * Decodes ABI-encoded data into its respective primitive values based on ABI Parameters.
 *
 * @example
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const data = AbiParameters.decode(
 *   AbiParameters.from(['string', 'uint', 'bool']),
 *   '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000',
 * )
 * // @log: ['wagmi', 420n, true]
 * ```
 *
 * @example
 * ### JSON Parameters
 *
 * You can pass **JSON ABI** Parameters:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const data = AbiParameters.decode(
 *   [
 *     { name: 'x', type: 'string' },
 *     { name: 'y', type: 'uint' },
 *     { name: 'z', type: 'bool' },
 *   ],
 *   '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000',
 * )
 * // @log: ['wagmi', 420n, true]
 * ```
 *
 * @param parameters - The set of ABI parameters to decode, in the shape of the `inputs` or `outputs` attribute of an ABI Item. These parameters must include valid [ABI types](https://docs.soliditylang.org/en/latest/types.html).
 * @param data - ABI encoded data.
 * @param options - Decoding options.
 * @returns Array of decoded values.
 */
export function AbiParameters_decode(
  parameters: AbiParameters,
  data: Bytes.Bytes | Hex.Hex,
  options?: {
    /**
     * Whether the decoded values should be returned as an `Object` or `Array`.
     *
     * @default "Array"
     */
    as?: 'Array' | 'Object' | undefined
  },
): readonly unknown[] | Record<string, unknown>

// eslint-disable-next-line jsdoc/require-jsdoc
export function AbiParameters_decode(
  parameters: AbiParameters,
  data: Bytes.Bytes | Hex.Hex,
  options: { as?: 'Array' | 'Object' | undefined } = {},
): readonly unknown[] | Record<string, unknown> {
  const { as = 'Array' } = options

  const bytes = typeof data === 'string' ? Bytes.fromHex(data) : data
  const cursor = createCursor(bytes)

  if (Bytes.size(bytes) === 0 && parameters.length > 0)
    throw new AbiParameters_ZeroDataError()
  if (Bytes.size(bytes) && Bytes.size(bytes) < 32)
    throw new AbiParameters_DataSizeTooSmallError({
      data: typeof data === 'string' ? data : Hex.fromBytes(data),
      parameters: parameters as readonly AbiParameters_Parameter[],
      size: Bytes.size(bytes),
    })

  let consumed = 0
  const values: any = as === 'Array' ? [] : {}
  for (let i = 0; i < parameters.length; ++i) {
    const param = parameters[i] as AbiParameters_Parameter
    cursor.setPosition(consumed)
    const [data, consumed_] = decodeParameter(cursor, param, {
      staticPosition: 0,
    })
    consumed += consumed_
    if (as === 'Array') values.push(data)
    else values[param.name ?? i] = data
  }
  return values
}

export declare namespace AbiParameters_decode {
  type Options<as extends 'Object' | 'Array'> = {
    /**
     * Whether the decoded values should be returned as an `Object` or `Array`.
     *
     * @default "Array"
     */
    as?: as | 'Object' | 'Array' | undefined
  }

  type ReturnType<
    parameters extends AbiParameters = AbiParameters,
    as extends 'Object' | 'Array' = 'Array',
  > = parameters extends readonly []
    ? as extends 'Object'
      ? {}
      : []
    : as extends 'Object'
      ? AbiParameters_ToObject<parameters>
      : AbiParameters_ToPrimitiveTypes<parameters>

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | decodeParameter.ErrorType
    | AbiParameters_ZeroDataError
    | AbiParameters_DataSizeTooSmallError
    | Errors.GlobalErrorType
}

AbiParameters_decode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiParameters_decode.ErrorType

//////////////////////////////////////////////////////////////////////////////
// Internal
//////////////////////////////////////////////////////////////////////////////

/** @internal */
export function decodeParameter(
  cursor: Cursor,
  param: AbiParameters_Parameter,
  { staticPosition }: { staticPosition: number },
) {
  const arrayComponents = getArrayComponents(param.type)
  if (arrayComponents) {
    const [length, type] = arrayComponents
    return decodeArray(cursor, { ...param, type }, { length, staticPosition })
  }
  if (param.type === 'tuple')
    return decodeTuple(cursor, param as TupleAbiParameter, { staticPosition })

  if (param.type === 'address') return decodeAddress(cursor)
  if (param.type === 'bool') return decodeBool(cursor)
  if (param.type.startsWith('bytes'))
    return decodeBytes(cursor, param, { staticPosition })
  if (param.type.startsWith('uint') || param.type.startsWith('int'))
    return decodeNumber(cursor, param)
  if (param.type === 'string') return decodeString(cursor, { staticPosition })
  throw new AbiParameters_InvalidTypeError(param.type)
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
    | AbiParameters_InvalidTypeError
    | Errors.GlobalErrorType
}

////////////////////////////////////////////////////////////////////////////
// Type Decoders
////////////////////////////////////////////////////////////////////////////

const sizeOfLength = 32
const sizeOfOffset = 32

/** @internal */
export function decodeAddress(cursor: Cursor) {
  const value = cursor.readBytes(32)
  return [Hex.fromBytes(Bytes.slice(value, -20)), 32]
}

export declare namespace decodeAddress {
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Bytes.slice.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function decodeArray(
  cursor: Cursor,
  param: AbiParameters_Parameter,
  { length, staticPosition }: { length: number | null; staticPosition: number },
) {
  // If the length of the array is not known in advance (dynamic array),
  // this means we will need to wonder off to the pointer and decode.
  if (!length) {
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
        staticPosition: startOfData,
      })
      consumed += consumed_
      value.push(data)
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
      staticPosition: staticPosition + consumed,
    })
    consumed += consumed_
    value.push(data)
  }
  return [value, consumed]
}

export declare namespace decodeArray {
  type ErrorType = Bytes.toNumber.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function decodeBool(cursor: Cursor) {
  return [Bytes.toBoolean(cursor.readBytes(32), { size: 32 }), 32]
}

export declare namespace decodeBool {
  type ErrorType = Bytes.toBoolean.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function decodeBytes(
  cursor: Cursor,
  param: AbiParameters_Parameter,
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

  const value = Hex.fromBytes(cursor.readBytes(Number.parseInt(size), 32))
  return [value, 32]
}

export declare namespace decodeBytes {
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Bytes.toNumber.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function decodeNumber(cursor: Cursor, param: AbiParameters_Parameter) {
  const signed = param.type.startsWith('int')
  const size = Number.parseInt(param.type.split('int')[1] || '256')
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
export type TupleAbiParameter = AbiParameters_Parameter & {
  components: readonly AbiParameters_Parameter[]
}

/** @internal */
export function decodeTuple(
  cursor: Cursor,
  param: TupleAbiParameter,
  { staticPosition }: { staticPosition: number },
) {
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
      staticPosition,
    })
    value[hasUnnamedChild ? i : component?.name!] = data
    consumed += consumed_
  }
  return [value, consumed]
}

export declare namespace decodeTuple {
  type ErrorType = Bytes.toNumber.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function decodeString(
  cursor: Cursor,
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
  const value = Bytes.toString(Bytes.trimLeft(data))

  // As we have gone wondering, restore to the original position + next slot.
  cursor.setPosition(staticPosition + 32)

  return [value, 32]
}

/** @internal */
export function hasDynamicChild(param: AbiParameters_Parameter) {
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
    } as AbiParameters_Parameter)
  )
    return true

  return false
}

export declare namespace decodeString {
  type ErrorType =
    | Bytes.toNumber.ErrorType
    | Bytes.toString.ErrorType
    | Bytes.trimLeft.ErrorType
    | Errors.GlobalErrorType
}
