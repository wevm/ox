import type { TypedDataDomain } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'
import { TypedData_extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { TypedData_hashDomain } from './hashDomain.js'

/**
 * Creates [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) domainSeparator for the provided domain.
 *
 * - Docs: https://oxlib.sh/api/typedData/domainSeparator
 * - Spec: https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.domainSeparator({
 *   name: 'Ether!',
 *   version: '1',
 *   chainId: 1,
 *   verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 * })
 * // '0x9911ee4f58a7059a8f5385248040e6984d80e2c849500fe6a4d11c4fa98c2af3'
 * ```
 */
export function TypedData_domainSeparator(
  domain: TypedDataDomain,
): TypedData_domainSeparator.ReturnType {
  return TypedData_hashDomain({
    domain,
    types: {
      EIP712Domain: TypedData_extractEip712DomainTypes(domain),
    },
  })
}

export declare namespace TypedData_domainSeparator {
  type ReturnType = Hex

  type ErrorType = TypedData_hashDomain.ErrorType | GlobalErrorType
}

TypedData_domainSeparator.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TypedData_domainSeparator.ErrorType
