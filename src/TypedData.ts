export type {
  TypedData_Definition as Definition,
  TypedData_EIP712DomainDefinition as EIP712DomainDefinition,
  TypedData_MessageDefinition as MessageDefinition,
} from './internal/typedData/types.js'

export { TypedData_domainSeparator as domainSeparator } from './internal/typedData/domainSeparator.js'

export { TypedData_encodeType as encodeType } from './internal/typedData/encodeType.js'

export { TypedData_extractEip712DomainTypes as extractEip712DomainTypes } from './internal/typedData/extractEip712DomainTypes.js'

export { TypedData_hash as hash } from './internal/typedData/hash.js'

export { TypedData_hashDomain as hashDomain } from './internal/typedData/hashDomain.js'

export { TypedData_hashStruct as hashStruct } from './internal/typedData/hashStruct.js'

export { TypedData_serialize as serialize } from './internal/typedData/serialize.js'

export { TypedData_validate as validate } from './internal/typedData/validate.js'
