import { AbiParameters_encode } from '../AbiParameters/encode.js'
import type { AbiParameters_Parameter } from '../AbiParameters/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { Hex_fromString } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { TypedData_encodeType } from './encodeType.js'
import type { TypedData } from './types.js'

// TODO: Add error for `primaryType` not in `types`
// TODO: Add type inference?

/**
 * Hashes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) struct.
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.hashStruct({
 *   types: {
 *     Foo: [
 *       { name: 'address', type: 'address' },
 *       { name: 'name', type: 'string' },
 *       { name: 'foo', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Foo',
 *   data: {
 *     address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *     name: 'jxom',
 *     foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *   },
 * })
 * // @log: '0x996fb3b6d48c50312d69abdd4c1b6fb02057c85aa86bb8d04c6f023326a168ce'
 * ```
 *
 * @param value - The Typed Data struct to hash.
 * @returns The hashed Typed Data struct.
 */
export function TypedData_hashStruct(value: TypedData_hashStruct.Value): Hex {
  const { data, primaryType, types } = value
  const encoded = encodeData({
    data,
    primaryType,
    types,
  })
  return Hash_keccak256(encoded)
}

export declare namespace TypedData_hashStruct {
  type Value = {
    /** The Typed Data struct to hash. */
    data: Record<string, unknown>
    /** The primary type of the Typed Data struct. */
    primaryType: string
    /** The types of the Typed Data struct. */
    types: TypedData
  }

  type ErrorType =
    | encodeData.ErrorType
    | Hash_keccak256.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
TypedData_hashStruct.parseError = (error: unknown) =>
  error as TypedData_hashStruct.ErrorType

/** @internal */
export function encodeData(value: {
  data: Record<string, unknown>
  primaryType: string
  types: TypedData
}): Hex {
  const { data, primaryType, types } = value
  const encodedTypes: AbiParameters_Parameter[] = [{ type: 'bytes32' }]
  const encodedValues: unknown[] = [hashType({ primaryType, types })]

  for (const field of types[primaryType] ?? []) {
    const [type, value] = encodeField({
      types,
      name: field.name,
      type: field.type,
      value: data[field.name],
    })
    encodedTypes.push(type)
    encodedValues.push(value)
  }

  return AbiParameters_encode(encodedTypes, encodedValues)
}

/** @internal */
export declare namespace encodeData {
  type ErrorType =
    | AbiParameters_encode.ErrorType
    | encodeField.ErrorType
    | hashType.ErrorType
    | GlobalErrorType
}

/** @internal */
export function hashType(value: {
  primaryType: string
  types: TypedData
}): Hex {
  const { primaryType, types } = value
  const encodedHashType = Hex_fromString(
    TypedData_encodeType({ primaryType, types }),
  )
  return Hash_keccak256(encodedHashType)
}

/** @internal */
export declare namespace hashType {
  type ErrorType =
    | Hex_fromString.ErrorType
    | TypedData_encodeType.ErrorType
    | Hash_keccak256.ErrorType
    | GlobalErrorType
}

/** @internal */
export function encodeField(properties: {
  types: TypedData
  name: string
  type: string
  value: any
}): [type: AbiParameters_Parameter, value: Hex] {
  let { types, name, type, value } = properties

  if (types[type] !== undefined)
    return [
      { type: 'bytes32' },
      Hash_keccak256(encodeData({ data: value, primaryType: type, types })),
    ]

  if (type === 'bytes') {
    const prepend = value.length % 2 ? '0' : ''
    value = `0x${prepend + value.slice(2)}`
    return [{ type: 'bytes32' }, Hash_keccak256(value)]
  }

  if (type === 'string') return [{ type: 'bytes32' }, Hash_keccak256(value)]

  if (type.lastIndexOf(']') === type.length - 1) {
    const parsedType = type.slice(0, type.lastIndexOf('['))
    const typeValuePairs = (value as [AbiParameters_Parameter, any][]).map(
      (item) =>
        encodeField({
          name,
          type: parsedType,
          types,
          value: item,
        }),
    )
    return [
      { type: 'bytes32' },
      Hash_keccak256(
        AbiParameters_encode(
          typeValuePairs.map(([t]) => t),
          typeValuePairs.map(([, v]) => v),
        ),
      ),
    ]
  }

  return [{ type }, value]
}

/** @internal */
export declare namespace encodeField {
  type ErrorType =
    | Hash_keccak256.ErrorType
    | AbiParameters_encode.ErrorType
    | GlobalErrorType
}
