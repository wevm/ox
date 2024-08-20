import type { TypedData, TypedDataDomain } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { hashStruct } from './hashStruct.js'

/**
 * Hashes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) domain.
 *
 * - Docs: https://oxlib.sh/api/typedData/hashDomain
 *
 * @example
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
 */
export function hashDomain(value: hashDomain.Value) {
  const { domain, types } = value
  return hashStruct({
    data: domain,
    primaryType: 'EIP712Domain',
    types,
  })
}

export declare namespace hashDomain {
  type Value = {
    domain: TypedDataDomain
    types: TypedData
  }

  type ErrorType = hashStruct.ErrorType | GlobalErrorType
}

hashDomain.parseError = (error: unknown) => error as hashDomain.ErrorType
