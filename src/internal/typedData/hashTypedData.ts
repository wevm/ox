import type { TypedData } from 'abitype'

import { concat } from '../data/concat.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import type { Hex } from '../types/data.js'
import type { TypedDataDefinition } from '../types/typedData.js'
import { extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { hashDomain } from './hashDomain.js'
import { hashStruct } from './hashStruct.js'
import { validateTypedData } from './validateTypedData.js'

export function hashTypedData<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(
  value: hashTypedData.Value<typedData, primaryType>,
): hashTypedData.ReturnType {
  const { domain = {}, message, primaryType } = value as hashTypedData.Value

  const types = {
    EIP712Domain: extractEip712DomainTypes(domain),
    ...value.types,
  } as TypedData

  // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
  // as we can't statically check this with TypeScript.
  validateTypedData({
    domain,
    message,
    primaryType,
    types,
  })

  const parts: Hex[] = ['0x1901']
  if (domain)
    parts.push(
      hashDomain({
        domain,
        types,
      }),
    )

  if (primaryType !== 'EIP712Domain')
    parts.push(
      hashStruct({
        data: message,
        primaryType,
        types,
      }),
    )

  return keccak256(concat(...parts))
}

export declare namespace hashTypedData {
  type Value<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedDataDefinition<typedData, primaryType>

  type ReturnType = Hex

  type ErrorType =
    | extractEip712DomainTypes.ErrorType
    | hashDomain.ErrorType
    | hashStruct.ErrorType
    | validateTypedData.ErrorType
    | GlobalErrorType
}
