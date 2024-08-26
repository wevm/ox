import type { AbiParameter, TypedData } from 'abitype'

import { Abi_encodeParameters } from '../abi/encodeParameters.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import { Hex_from } from '../hex/from.js'
import type { Hex } from '../types/data.js'
import { TypedData_encodeType } from './encodeType.js'

// TODO: Add error for `primaryType` not in `types`
// TODO: Add type inference?

/**
 * Hashes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) struct.
 *
 * - Docs: https://oxlib.sh/api/typedData/hashStruct
 * - Spec: https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct
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
 * // '0x996fb3b6d48c50312d69abdd4c1b6fb02057c85aa86bb8d04c6f023326a168ce'
 * ```
 */
export function TypedData_hashStruct(
  value: TypedData_hashStruct.Value,
): TypedData_hashStruct.ReturnType {
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
    data: Record<string, unknown>
    primaryType: string
    types: TypedData
  }

  type ReturnType = Hex

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
  const encodedTypes: AbiParameter[] = [{ type: 'bytes32' }]
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

  return Abi_encodeParameters(encodedTypes, encodedValues)
}

/** @internal */
export declare namespace encodeData {
  type ErrorType =
    | Abi_encodeParameters.ErrorType
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
  const encodedHashType = Hex_from(TypedData_encodeType({ primaryType, types }))
  return Hash_keccak256(encodedHashType)
}

/** @internal */
export declare namespace hashType {
  type ErrorType =
    | Hex_from.ErrorType
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
}): [type: AbiParameter, value: Hex] {
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

  if (type === 'string')
    return [{ type: 'bytes32' }, Hash_keccak256(Hex_from(value))]

  if (type.lastIndexOf(']') === type.length - 1) {
    const parsedType = type.slice(0, type.lastIndexOf('['))
    const typeValuePairs = (value as [AbiParameter, any][]).map((item) =>
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
        Abi_encodeParameters(
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
    | Abi_encodeParameters.ErrorType
    | Hex_from.ErrorType
    | GlobalErrorType
}
