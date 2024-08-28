import type {
  TypedData as abitype_TypedData,
  TypedDataDomain as abitype_TypedDataDomain,
  TypedDataParameter as abitype_TypedDataParameter,
  TypedDataToPrimitiveTypes,
} from 'abitype'

import type { Compute } from '../types.js'

export type TypedData = abitype_TypedData
export type TypedData_Domain = abitype_TypedDataDomain
export type TypedData_Parameter = abitype_TypedDataParameter

// TODO: Make reusable for Viem?
export type TypedData_Definition<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  ///
  primaryTypes = typedData extends TypedData ? keyof typedData : string,
> = primaryType extends 'EIP712Domain'
  ? TypedData_EIP712DomainDefinition<typedData, primaryType>
  : TypedData_MessageDefinition<typedData, primaryType, primaryTypes>

export type TypedData_EIP712DomainDefinition<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends 'EIP712Domain' = 'EIP712Domain',
  ///
  schema extends Record<string, unknown> = typedData extends TypedData
    ? TypedDataToPrimitiveTypes<typedData>
    : Record<string, unknown>,
> = {
  types?: typedData | undefined
} & {
  primaryType:
    | 'EIP712Domain'
    | (primaryType extends 'EIP712Domain' ? primaryType : never)
  domain: schema extends { EIP712Domain: infer domain }
    ? domain
    : Compute<TypedData_Domain>
  message?: undefined
}

export type TypedData_MessageDefinition<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends keyof typedData = keyof typedData,
  ///
  primaryTypes = typedData extends TypedData ? keyof typedData : string,
  schema extends Record<string, unknown> = typedData extends TypedData
    ? TypedDataToPrimitiveTypes<typedData>
    : Record<string, unknown>,
  message = schema[primaryType extends keyof schema
    ? primaryType
    : keyof schema],
> = {
  types: typedData
} & {
  primaryType:
    | primaryTypes // show all values
    | (primaryType extends primaryTypes ? primaryType : never) // infer value
  domain?:
    | (schema extends { EIP712Domain: infer domain }
        ? domain
        : Compute<TypedData_Domain>)
    | undefined
  message: { [_: string]: any } extends message // Check if message was inferred
    ? Record<string, unknown>
    : message
}
