import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import { TypedData_extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { TypedData_hashStruct } from './hashStruct.js'
import type { TypedData_Domain, TypedData_Parameter } from './types.js'

/**
 * Hashes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) domain.
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
 * })
 * // @log: '0x6192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1'
 * ```
 *
 * @param value - The Typed Data domain and types.
 * @returns The hashed domain.
 */
export function TypedData_hashDomain(value: TypedData_hashDomain.Value): Hex {
  const { domain, types } = value
  return TypedData_hashStruct({
    data: domain,
    primaryType: 'EIP712Domain',
    types: {
      ...types,
      EIP712Domain:
        types?.EIP712Domain || TypedData_extractEip712DomainTypes(domain),
    },
  })
}

export declare namespace TypedData_hashDomain {
  type Value = {
    /** The Typed Data domain. */
    domain: TypedData_Domain
    /** The Typed Data types. */
    types?:
      | {
          EIP712Domain?: readonly TypedData_Parameter[] | undefined
          [key: string]: readonly TypedData_Parameter[] | undefined
        }
      | undefined
  }

  type ErrorType = TypedData_hashStruct.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
TypedData_hashDomain.parseError = (error: unknown) =>
  error as TypedData_hashDomain.ErrorType
