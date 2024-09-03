import {
  InvalidAddressError,
  InvalidAddressInputError,
} from '../Address/errors.js'
import { Address_isAddress } from '../Address/isAddress.js'
import { BytesSizeMismatchError } from '../Errors/data.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromNumber } from '../Hex/from.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'
import {
  Solidity_bytesRegex,
  Solidity_integerRegex,
} from '../Solidity/constants.js'
import { InvalidPrimaryTypeError } from './errors.js'
import type {
  TypedData,
  TypedData_Definition,
  TypedData_Parameter,
} from './types.js'

/**
 * Validates [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712).
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.validate({
 *   domain: {
 *     name: 'Ether!',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 *   },
 *   primaryType: 'Foo',
 *   types: {
 *     Foo: [
 *       { name: 'address', type: 'address' },
 *       { name: 'name', type: 'string' },
 *       { name: 'foo', type: 'string' },
 *     ],
 *   },
 *   message: {
 *     address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *     name: 'jxom',
 *     foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *   },
 * })
 * ```
 *
 * @param value - The Typed Data to validate.
 */
export function TypedData_validate<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(value: TypedData_validate.Value<typedData, primaryType>): void {
  const { domain, message, primaryType, types } =
    value as unknown as TypedData_validate.Value

  const validateData = (
    struct: readonly TypedData_Parameter[],
    data: Record<string, unknown>,
  ) => {
    for (const param of struct) {
      const { name, type } = param
      const value = data[name]

      const integerMatch = type.match(Solidity_integerRegex)
      if (
        integerMatch &&
        (typeof value === 'number' || typeof value === 'bigint')
      ) {
        const [, base, size_] = integerMatch
        // If number cannot be cast to a sized hex value, it is out of range
        // and will throw.
        Hex_fromNumber(value, {
          signed: base === 'int',
          size: Number.parseInt(size_ ?? '') / 8,
        })
      }

      if (
        type === 'address' &&
        typeof value === 'string' &&
        !Address_isAddress(value)
      )
        throw new InvalidAddressError({
          address: value,
          cause: new InvalidAddressInputError(),
        })

      const bytesMatch = type.match(Solidity_bytesRegex)
      if (bytesMatch) {
        const [, size] = bytesMatch
        if (size && Hex_size(value as Hex) !== Number.parseInt(size))
          throw new BytesSizeMismatchError({
            expectedSize: Number.parseInt(size),
            givenSize: Hex_size(value as Hex),
          })
      }

      const struct = types[type]
      if (struct) validateData(struct, value as Record<string, unknown>)
    }
  }

  // Validate domain types.
  if (types.EIP712Domain && domain) validateData(types.EIP712Domain, domain)

  // Validate message types.
  if (primaryType !== 'EIP712Domain') {
    if (types[primaryType]) validateData(types[primaryType], message)
    else throw new InvalidPrimaryTypeError({ primaryType, types })
  }
}

export declare namespace TypedData_validate {
  type Value<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedData_Definition<typedData, primaryType>

  type ErrorType =
    | InvalidAddressError
    | InvalidPrimaryTypeError
    | Hex_fromNumber.ErrorType
    | Hex_size.ErrorType
    | GlobalErrorType
}

TypedData_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TypedData_validate.ErrorType
