import type { TypedDataDomain } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import { extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { hashDomain } from './hashDomain.js'

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
