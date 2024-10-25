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

import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'
import { concat } from '../Hex/concat.js'
import { fromBoolean } from '../Hex/fromBoolean.js'
import { fromNumber } from '../Hex/fromNumber.js'
import { fromString } from '../Hex/fromString.js'
import { padLeft, padRight } from '../Hex/pad.js'
import type { Hex } from '../Hex/types.js'
import {
  Solidity_arrayRegex,
  Solidity_bytesRegex,
  Solidity_integerRegex,
} from '../Solidity/constants.js'
import {
  AbiParameters_BytesSizeMismatchError,
  AbiParameters_InvalidTypeError,
  AbiParameters_LengthMismatchError,
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
    throw new AbiParameters_LengthMismatchError({
      expectedLength: types.length as number,
      givenLength: values.length as number,
    })

  const data: Hex[] = []
  for (let i = 0; i < (types as unknown[]).length; i++) {
    const type = types[i]
    const value = values[i]
    data.push(encode(type, value))
  }
  return concat(...data)
}

export declare namespace AbiParameters_encodePacked {
  type ErrorType =
    | concat.ErrorType
    | AbiParameters_LengthMismatchError
    | Errors.GlobalErrorType
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
    | Address.assert.ErrorType
    | concat.ErrorType
    | padLeft.ErrorType
    | padRight.ErrorType
    | fromBoolean.ErrorType
    | fromNumber.ErrorType
    | fromString.ErrorType
    | Errors.GlobalErrorType
}

function encode<const packedAbiType extends PackedAbiType | unknown>(
  type: packedAbiType,
  value: EncodePackedValues<[packedAbiType]>[0],
  isArray = false,
): Hex {
  if (type === 'address') {
    const address = value as Address.Address
    Address.assert(address)
    return padLeft(
      address.toLowerCase() as Hex,
      isArray ? 32 : 0,
    ) as Address.Address
  }
  if (type === 'string') return fromString(value as string)
  if (type === 'bytes') return value as Hex
  if (type === 'bool')
    return padLeft(fromBoolean(value as boolean), isArray ? 32 : 1)

  const intMatch = (type as string).match(Solidity_integerRegex)
  if (intMatch) {
    const [_type, baseType, bits = '256'] = intMatch
    const size = Number.parseInt(bits) / 8
    return fromNumber(value as number, {
      size: isArray ? 32 : size,
      signed: baseType === 'int',
    })
  }

  const bytesMatch = (type as string).match(Solidity_bytesRegex)
  if (bytesMatch) {
    const [_type, size] = bytesMatch
    if (Number.parseInt(size!) !== ((value as Hex).length - 2) / 2)
      throw new AbiParameters_BytesSizeMismatchError({
        expectedSize: Number.parseInt(size!),
        value: value as Hex,
      })
    return padRight(value as Hex, isArray ? 32 : 0) as Hex
  }

  const arrayMatch = (type as string).match(Solidity_arrayRegex)
  if (arrayMatch && Array.isArray(value)) {
    const [_type, childType] = arrayMatch
    const data: Hex[] = []
    for (let i = 0; i < value.length; i++) {
      data.push(encode(childType, value[i], true))
    }
    if (data.length === 0) return '0x'
    return concat(...data)
  }

  throw new AbiParameters_InvalidTypeError(type as string)
}
