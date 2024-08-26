import type { TypedData } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import { Hex_concat } from '../hex/concat.js'
import type { Hex } from '../types/data.js'
import type { TypedData_Definition } from '../types/typedData.js'
import { TypedData_extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { TypedData_hashDomain } from './hashDomain.js'
import { TypedData_hashStruct } from './hashStruct.js'
import { TypedData_validate } from './validate.js'

/**
 * Hashes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712).
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.hash({
 *   types: {
 *     Foo: [
 *       { name: 'address', type: 'address' },
 *       { name: 'name', type: 'string' },
 *       { name: 'foo', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Foo',
 *   message: {
 *     address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *     name: 'jxom',
 *     foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *   },
 * })
 * // '0x7ef8d6931ed54977c7593289c0feb25c7d7424fb997f4fc20aa3fe51b5141188'
 * ```
 */
export function TypedData_hash<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(
  value: TypedData_hash.Value<typedData, primaryType>,
): TypedData_hash.ReturnType {
  const { domain = {}, message, primaryType } = value as TypedData_hash.Value

  const types = {
    EIP712Domain: TypedData_extractEip712DomainTypes(domain),
    ...value.types,
  } as TypedData

  // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
  // as we can't statically check this with TypeScript.
  TypedData_validate({
    domain,
    message,
    primaryType,
    types,
  })

  const parts: Hex[] = ['0x1901']
  if (domain)
    parts.push(
      TypedData_hashDomain({
        domain,
        types,
      }),
    )

  if (primaryType !== 'EIP712Domain')
    parts.push(
      TypedData_hashStruct({
        data: message,
        primaryType,
        types,
      }),
    )

  return Hash_keccak256(Hex_concat(...parts))
}

export declare namespace TypedData_hash {
  type Value<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedData_Definition<typedData, primaryType>

  type ReturnType = Hex

  type ErrorType =
    | TypedData_extractEip712DomainTypes.ErrorType
    | TypedData_hashDomain.ErrorType
    | TypedData_hashStruct.ErrorType
    | TypedData_validate.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
TypedData_hash.parseError = (error: unknown) =>
  error as TypedData_hash.ErrorType
