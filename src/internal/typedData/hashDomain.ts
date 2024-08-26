import type { TypedData, TypedDataDomain } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { TypedData_hashStruct } from './hashStruct.js'

/**
 * Hashes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) domain.
 *
 * - Docs: https://oxlib.sh/api/typedData/hashDomain
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.hashDomain({
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0x0000000000000000000000000000000000000000',
 *   },
 *   types: {
 *     Foo: [
 *       { name: 'address', type: 'address' },
 *       { name: 'name', type: 'string' },
 *       { name: 'foo', type: 'string' },
 *     ],
 *   },
 * })
 * // '0x6192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1'
 * ```
 */
export function TypedData_hashDomain(value: TypedData_hashDomain.Value) {
  const { domain, types } = value
  return TypedData_hashStruct({
    data: domain,
    primaryType: 'EIP712Domain',
    types,
  })
}

export declare namespace TypedData_hashDomain {
  type Value = {
    domain: TypedDataDomain
    types: TypedData
  }

  type ErrorType = TypedData_hashStruct.ErrorType | GlobalErrorType
}

/* v8 ignore next */
TypedData_hashDomain.parseError = (error: unknown) =>
  error as TypedData_hashDomain.ErrorType
