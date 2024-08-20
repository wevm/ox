import type { TypedDataDomain } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import { extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { hashDomain } from './hashDomain.js'

/**
 * Creates [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) domainSeparator for the provided domain.
 *
 * - Docs: https://oxlib.sh/api/typedData/domainSeparator
 *
 * @example
 * import { TypedData } from 'ox'
 *
 * TypedData.domainSeparator({
 *   name: 'Ether!',
 *   version: '1',
 *   chainId: 1,
 *   verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 * })
 * // '0x9911ee4f58a7059a8f5385248040e6984d80e2c849500fe6a4d11c4fa98c2af3'
 */
export function domainSeparator(
  domain: TypedDataDomain,
): domainSeparator.ReturnType {
  return hashDomain({
    domain,
    types: {
      EIP712Domain: extractEip712DomainTypes(domain),
    },
  })
}

export declare namespace domainSeparator {
  type ReturnType = Hex

  type ErrorType = hashDomain.ErrorType | GlobalErrorType
}

domainSeparator.parseError = (error: unknown) =>
  error as domainSeparator.ErrorType
