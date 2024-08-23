import type {
  AbiParameterToPrimitiveType,
  AbiType,
  Address,
  SolidityAddress,
  SolidityArrayWithoutTuple,
  SolidityBool,
  SolidityBytes,
  SolidityInt,
  SolidityString,
} from 'abitype'

import { assertAddress } from '../address/assertAddress.js'
import { arrayRegex, bytesRegex, integerRegex } from '../constants/regex.js'
import { concatHex } from '../data/concat.js'
import { padLeft, padRight } from '../data/pad.js'
import {
  AbiEncodingBytesSizeMismatchError,
  AbiEncodingLengthMismatchError,
  InvalidAbiTypeError,
} from '../errors/abi.js'
import type { GlobalErrorType } from '../errors/error.js'
import { booleanToHex, numberToHex, stringToHex } from '../hex/toHex.js'
import type { Hex } from '../types/data.js'

type PackedAbiType =
  | SolidityAddress
  | SolidityBool
  | SolidityBytes
  | SolidityInt
  | SolidityString
  | SolidityArrayWithoutTuple

type EncodePackedValues<
  packedAbiTypes extends readonly PackedAbiType[] | readonly unknown[],
> = {
  [K in keyof packedAbiTypes]: packedAbiTypes[K] extends AbiType
    ? AbiParameterToPrimitiveType<{ type: packedAbiTypes[K] }>
    : unknown
}

/**
 * Encodes an array of primitive values to a [packed ABI encoding](https://docs.soliditylang.org/en/latest/abi-spec.html#non-standard-packed-mode).
 *
 * @example
 * ```ts
 * import { Abi } from 'viem'
 *
 * const encoded = Abi.encodePacked(
 *   ['address', 'string'],
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 'hello world'],
 * )
 * // '0xd8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64'
 * ```
 */
export function encodePacked<
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
  return concatHex(...data)
}

export declare namespace encodePacked {
  type ErrorType =
    | concatHex.ErrorType
    | AbiEncodingLengthMismatchError
    | GlobalErrorType
}

/* v8 ignore next */
encodePacked.parseError = (error: unknown) => error as encodePacked.ErrorType

declare namespace encode {
  type ErrorType =
    | assertAddress.ErrorType
    | concatHex.ErrorType
    | padLeft.ErrorType
    | padRight.ErrorType
    | booleanToHex.ErrorType
    | numberToHex.ErrorType
    | stringToHex.ErrorType
    | GlobalErrorType
}

function encode<const packedAbiType extends PackedAbiType | unknown>(
  type: packedAbiType,
  value: EncodePackedValues<[packedAbiType]>[0],
  isArray = false,
): Hex {
  if (type === 'address') {
    const address = value as Address
    assertAddress(address)
    return padLeft(address.toLowerCase() as Hex, isArray ? 32 : 0) as Address
  }
  if (type === 'string') return stringToHex(value as string)
  if (type === 'bytes') return value as Hex
  if (type === 'bool')
    return padLeft(booleanToHex(value as boolean), isArray ? 32 : 1)

  const intMatch = (type as string).match(integerRegex)
  if (intMatch) {
    const [_type, baseType, bits = '256'] = intMatch
    const size = Number.parseInt(bits) / 8
    return numberToHex(value as number, {
      size: isArray ? 32 : size,
      signed: baseType === 'int',
    })
  }

  const bytesMatch = (type as string).match(bytesRegex)
  if (bytesMatch) {
    const [_type, size] = bytesMatch
    if (Number.parseInt(size!) !== ((value as Hex).length - 2) / 2)
      throw new AbiEncodingBytesSizeMismatchError({
        expectedSize: Number.parseInt(size!),
        value: value as Hex,
      })
    return padRight(value as Hex, isArray ? 32 : 0) as Hex
  }

  const arrayMatch = (type as string).match(arrayRegex)
  if (arrayMatch && Array.isArray(value)) {
    const [_type, childType] = arrayMatch
    const data: Hex[] = []
    for (let i = 0; i < value.length; i++) {
      data.push(encode(childType, value[i], true))
    }
    if (data.length === 0) return '0x'
    return concatHex(...data)
  }

  throw new InvalidAbiTypeError(type as string)
}
