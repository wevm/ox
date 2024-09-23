import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_concat } from '../Hex/concat.js'
import type { Hex } from '../Hex/types.js'
import { TypedData_extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { TypedData_hashDomain } from './hashDomain.js'
import { TypedData_hashStruct } from './hashStruct.js'
import type { TypedData, TypedData_Definition } from './types.js'
import { TypedData_assert } from './assert.js'

/**
 * Encodes typed data in [EIP-712 format](https://eips.ethereum.org/EIPS/eip-712): `0x19 ‖ 0x01 ‖ domainSeparator ‖ hashStruct(message)`.
 *
 * @example
 * ```ts twoslash
 * import { TypedData, Hash } from 'ox'
 *
 * const data = TypedData.encode({ // [!code focus:33]
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0x0000000000000000000000000000000000000000',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: {
 *       name: 'Cow',
 *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
 *     },
 *     to: {
 *       name: 'Bob',
 *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
 *     },
 *     contents: 'Hello, Bob!',
 *   },
 * })
 * // @log: '0x19012fdf3441fcaf4f30c7e16292b258a5d7054a4e2e00dbd7b7d2f467f2b8fb9413c52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e'
 * // @log: (0x19 ‖ 0x01 ‖ domainSeparator ‖ hashStruct(message))
 *
 * const hash = Hash.keccak256(data)
 * ```
 *
 * @param value - The Typed Data to encode.
 * @returns The encoded Typed Data.
 */
export function TypedData_encode<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(value: TypedData_encode.Value<typedData, primaryType>): Hex {
  const { domain = {}, message, primaryType } = value as TypedData_encode.Value

  const types = {
    EIP712Domain: TypedData_extractEip712DomainTypes(domain),
    ...value.types,
  } as TypedData

  // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
  // as we can't statically check this with TypeScript.
  TypedData_assert({
    domain,
    message,
    primaryType,
    types,
  })

  // Typed Data Format: `0x19 ‖ 0x01 ‖ domainSeparator ‖ hashStruct(message)`
  const parts: Hex[] = ['0x19', '0x01']
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

  return Hex_concat(...parts)
}

export declare namespace TypedData_encode {
  type Value<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedData_Definition<typedData, primaryType>

  type ErrorType =
    | TypedData_extractEip712DomainTypes.ErrorType
    | TypedData_hashDomain.ErrorType
    | TypedData_hashStruct.ErrorType
    | TypedData_assert.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
TypedData_encode.parseError = (error: unknown) =>
  error as TypedData_encode.ErrorType
