import type { TypedData, TypedDataDomain } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { hashStruct } from './hashStruct.js'

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
