import type {
  AbiParameterToPrimitiveType,
  AbiType,
  SolidityAddress,
  SolidityArrayWithoutTuple,
  SolidityBool,
  SolidityBytes,
  SolidityInt,
  SolidityString,
} from 'abitype'

import { Address_assert } from '../Address/assert.js'
import type { Address } from '../Address/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_fromBoolean, Hex_fromNumber, Hex_fromString } from '../Hex/from.js'
import { Hex_padLeft, Hex_padRight } from '../Hex/pad.js'
import type { Hex } from '../Hex/types.js'
import {
  Solidity_arrayRegex,
  Solidity_bytesRegex,
  Solidity_integerRegex,
} from '../Solidity/constants.js'
import {
  AbiEncodingBytesSizeMismatchError,
  AbiEncodingLengthMismatchError,
  InvalidAbiTypeError,
} from './errors.js'

/**
 * Encodes an array of primitive values to a [packed ABI encoding](https://docs.soliditylang.org/en/latest/abi-spec.html#non-standard-packed-mode).
 *
 * @example
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const encoded = AbiParameters.encodePacked(
 *   ['address', 'string'],
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 'hello world'],
 * )
 * // @log: '0xd8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64'
 * ```
 *
 * @param types - Set of ABI types to pack encode.
 * @param values - The set of primitive values that correspond to the ABI types defined in `types`.
 * @returns The encoded packed data.
 */
export function AbiParameters_encodePacked<
  const packedAbiTypes extends readonly PackedAbiType[] | readonly unknown[],
>(types: packedAbiTypes, values: EncodePackedValues<packedAbiTypes>): Hex {
  if (types.length !== values.length)
    throw new AbiEncodingLengthMismatchError({
      expectedLength: types.length as number,
      givenLength: values.length as number,
    })

  const data: Hex[] = []
  for (let i = 0; i < (types as unknown[]).length; i++) {
    const type = types[i]
    const value = values[i]
    data.push(encode(type, value))
  }
  return Hex_concat(...data)
}

export declare namespace AbiParameters_encodePacked {
  type ErrorType =
    | Hex_concat.ErrorType
    | AbiEncodingLengthMismatchError
    | GlobalErrorType
}

/* v8 ignore next */
AbiParameters_encodePacked.parseError = (error: unknown) =>
  error as AbiParameters_encodePacked.ErrorType

/** @internal */
export type PackedAbiType =
  | SolidityAddress
  | SolidityBool
  | SolidityBytes
  | SolidityInt
  | SolidityString
  | SolidityArrayWithoutTuple

/** @internal */
export type EncodePackedValues<
  packedAbiTypes extends readonly PackedAbiType[] | readonly unknown[],
> = {
  [key in keyof packedAbiTypes]: packedAbiTypes[key] extends AbiType
    ? AbiParameterToPrimitiveType<{ type: packedAbiTypes[key] }>
    : unknown
}

//////////////////////////////////////////////////////////////////////////////
// Internal
//////////////////////////////////////////////////////////////////////////////

declare namespace encode {
  type ErrorType =
    | Address_assert.ErrorType
    | Hex_concat.ErrorType
    | Hex_padLeft.ErrorType
    | Hex_padRight.ErrorType
    | Hex_fromBoolean.ErrorType
    | Hex_fromNumber.ErrorType
    | Hex_fromString.ErrorType
    | GlobalErrorType
}

function encode<const packedAbiType extends PackedAbiType | unknown>(
  type: packedAbiType,
  value: EncodePackedValues<[packedAbiType]>[0],
  isArray = false,
): Hex {
  if (type === 'address') {
    const address = value as Address
    Address_assert(address)
    return Hex_padLeft(
      address.toLowerCase() as Hex,
      isArray ? 32 : 0,
    ) as Address
  }
  if (type === 'string') return Hex_fromString(value as string)
  if (type === 'bytes') return value as Hex
  if (type === 'bool')
    return Hex_padLeft(Hex_fromBoolean(value as boolean), isArray ? 32 : 1)

  const intMatch = (type as string).match(Solidity_integerRegex)
  if (intMatch) {
    const [_type, baseType, bits = '256'] = intMatch
    const size = Number.parseInt(bits) / 8
    return Hex_fromNumber(value as number, {
      size: isArray ? 32 : size,
      signed: baseType === 'int',
    })
  }

  const bytesMatch = (type as string).match(Solidity_bytesRegex)
  if (bytesMatch) {
    const [_type, size] = bytesMatch
    if (Number.parseInt(size!) !== ((value as Hex).length - 2) / 2)
      throw new AbiEncodingBytesSizeMismatchError({
        expectedSize: Number.parseInt(size!),
        value: value as Hex,
      })
    return Hex_padRight(value as Hex, isArray ? 32 : 0) as Hex
  }

  const arrayMatch = (type as string).match(Solidity_arrayRegex)
  if (arrayMatch && Array.isArray(value)) {
    const [_type, childType] = arrayMatch
    const data: Hex[] = []
    for (let i = 0; i < value.length; i++) {
      data.push(encode(childType, value[i], true))
    }
    if (data.length === 0) return '0x'
    return Hex_concat(...data)
  }

  throw new InvalidAbiTypeError(type as string)
}
