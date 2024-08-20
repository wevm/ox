import type { AbiParameter, TypedData } from 'abitype'

import { encodeAbiParameters } from '../abi/encodeParameters.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import { toHex } from '../hex/toHex.js'
import type { Hex } from '../types/data.js'
import { encodeType } from './encodeType.js'

export function hashStruct(value: hashStruct.Value): hashStruct.ReturnType {
  const { data, primaryType, types } = value
  const encoded = encodeData({
    data,
    primaryType,
    types,
  })
  return keccak256(encoded)
}

export declare namespace hashStruct {
  type Value = {
    data: Record<string, unknown>
    primaryType: string
    types: TypedData
  }

  type ReturnType = Hex

  type ErrorType = encodeData.ErrorType | keccak256.ErrorType | GlobalErrorType
}

hashStruct.parseError = (error: unknown) => error as hashStruct.ErrorType

function encodeData(value: {
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

  return encodeAbiParameters(encodedTypes, encodedValues)
}

declare namespace encodeData {
  type ErrorType =
    | encodeAbiParameters.ErrorType
    | encodeField.ErrorType
    | hashType.ErrorType
    | GlobalErrorType
}

function hashType(value: {
  primaryType: string
  types: TypedData
}): Hex {
  const { primaryType, types } = value
  const encodedHashType = toHex(encodeType({ primaryType, types }))
  return keccak256(encodedHashType)
}

declare namespace hashType {
  type ErrorType =
    | toHex.ErrorType
    | encodeType.ErrorType
    | keccak256.ErrorType
    | GlobalErrorType
}

function encodeField(properties: {
  types: TypedData
  name: string
  type: string
  value: any
}): [type: AbiParameter, value: Hex] {
  let { types, name, type, value } = properties

  if (types[type] !== undefined)
    return [
      { type: 'bytes32' },
      keccak256(encodeData({ data: value, primaryType: type, types })),
    ]

  if (type === 'bytes') {
    const prepend = value.length % 2 ? '0' : ''
    value = `0x${prepend + value.slice(2)}`
    return [{ type: 'bytes32' }, keccak256(value)]
  }

  if (type === 'string') return [{ type: 'bytes32' }, keccak256(toHex(value))]

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
      keccak256(
        encodeAbiParameters(
          typeValuePairs.map(([t]) => t),
          typeValuePairs.map(([, v]) => v),
        ),
      ),
    ]
  }

  return [{ type }, value]
}

declare namespace encodeField {
  type ErrorType =
    | keccak256.ErrorType
    | encodeAbiParameters.ErrorType
    | toHex.ErrorType
    | GlobalErrorType
}
