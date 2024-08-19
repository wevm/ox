import type { TypedData, TypedDataParameter } from 'abitype'

import { numberToHex } from '../hex/toHex.js'
import {
  InvalidAddressError,
  InvalidAddressInputError,
} from '../errors/address.js'
import type { GlobalErrorType } from '../errors/error.js'
import { isAddress } from '../address/isAddress.js'
import { bytesRegex, integerRegex } from '../constants/regex.js'
import { size } from '../data/size.js'
import type { Hex } from '../types/data.js'
import { BytesSizeMismatchError } from '../errors/data.js'
import type { TypedDataDefinition } from '../types/typedData.js'
import { InvalidPrimaryTypeError } from '../errors/typedData.js'

/**
 * Validates [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712).
 *
 * - Docs: https://oxlib.sh/api/typedData/validate
 *
 * @example
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
 */
export function validateTypedData<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(parameters: validateTypedData.Parameters<typedData, primaryType>) {
  const { domain, message, primaryType, types } =
    parameters as unknown as validateTypedData.Parameters

  const validateData = (
    struct: readonly TypedDataParameter[],
    data: Record<string, unknown>,
  ) => {
    for (const param of struct) {
      const { name, type } = param
      const value = data[name]

      const integerMatch = type.match(integerRegex)
      if (
        integerMatch &&
        (typeof value === 'number' || typeof value === 'bigint')
      ) {
        const [, base, size_] = integerMatch
        // If number cannot be cast to a sized hex value, it is out of range
        // and will throw.
        numberToHex(value, {
          signed: base === 'int',
          size: Number.parseInt(size_ ?? '') / 8,
        })
      }

      if (type === 'address' && typeof value === 'string' && !isAddress(value))
        throw new InvalidAddressError({
          address: value,
          cause: new InvalidAddressInputError(),
        })

      const bytesMatch = type.match(bytesRegex)
      if (bytesMatch) {
        const [, size_] = bytesMatch
        if (size_ && size(value as Hex) !== Number.parseInt(size_))
          throw new BytesSizeMismatchError({
            expectedSize: Number.parseInt(size_),
            givenSize: size(value as Hex),
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

export declare namespace validateTypedData {
  type Parameters<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedDataDefinition<typedData, primaryType>

  type ErrorType =
    | InvalidAddressError
    | InvalidPrimaryTypeError
    | numberToHex.ErrorType
    | size.ErrorType
    | GlobalErrorType
}
