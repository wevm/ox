import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import {
  Address_InvalidAddressError,
  Address_InvalidInputError,
} from '../Address/errors.js'
import { Address_validate } from '../Address/validate.js'
import {
  Solidity_bytesRegex,
  Solidity_integerRegex,
} from '../Solidity/constants.js'
import {
  TypedData_BytesSizeMismatchError,
  TypedData_InvalidPrimaryTypeError,
  TypedData_InvalidStructTypeError,
} from './errors.js'
import type {
  TypedData,
  TypedData_Definition,
  TypedData_Parameter,
} from './types.js'

/**
 * Asserts that [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) is valid.
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.assert({
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
export function TypedData_assert<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(value: TypedData_assert.Value<typedData, primaryType>): void {
  const { domain, message, primaryType, types } =
    value as unknown as TypedData_assert.Value

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
        Hex.fromNumber(value, {
          signed: base === 'int',
          size: Number.parseInt(size_ ?? '') / 8,
        })
      }

      if (
        type === 'address' &&
        typeof value === 'string' &&
        !Address_validate(value)
      )
        throw new Address_InvalidAddressError({
          address: value,
          cause: new Address_InvalidInputError(),
        })

      const bytesMatch = type.match(Solidity_bytesRegex)
      if (bytesMatch) {
        const [, size] = bytesMatch
        if (size && Hex.size(value as Hex) !== Number.parseInt(size))
          throw new TypedData_BytesSizeMismatchError({
            expectedSize: Number.parseInt(size),
            givenSize: Hex.size(value as Hex),
          })
      }

      const struct = types[type]
      if (struct) {
        validateReference(type)
        validateData(struct, value as Record<string, unknown>)
      }
    }
  }

  // Validate domain types.
  if (types.EIP712Domain && domain) validateData(types.EIP712Domain, domain)

  // Validate message types.
  if (primaryType !== 'EIP712Domain') {
    if (types[primaryType]) validateData(types[primaryType], message)
    else throw new TypedData_InvalidPrimaryTypeError({ primaryType, types })
  }
}

export declare namespace TypedData_assert {
  type Value<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedData_Definition<typedData, primaryType>

  type ErrorType =
    | Address_InvalidAddressError
    | TypedData_BytesSizeMismatchError
    | TypedData_InvalidPrimaryTypeError
    | Hex.fromNumber.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

TypedData_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TypedData_assert.ErrorType

/** @internal */
function validateReference(type: string) {
  // Struct type must not be a Solidity type.
  if (
    type === 'address' ||
    type === 'bool' ||
    type === 'string' ||
    type.startsWith('bytes') ||
    type.startsWith('uint') ||
    type.startsWith('int')
  )
    throw new TypedData_InvalidStructTypeError({ type })
}
