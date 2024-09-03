export type {
  TypedData,
  TypedData_Domain as Domain,
  TypedData_Parameter as Parameter,
  TypedData_Definition as Definition,
  TypedData_EIP712DomainDefinition as EIP712DomainDefinition,
  TypedData_MessageDefinition as MessageDefinition,
} from './internal/TypedData/types.js'

export { InvalidPrimaryTypeError } from './internal/TypedData/errors.js'

export { TypedData_domainSeparator as domainSeparator } from './internal/TypedData/domainSeparator.js'

export { TypedData_encodeType as encodeType } from './internal/TypedData/encodeType.js'

export { TypedData_extractEip712DomainTypes as extractEip712DomainTypes } from './internal/TypedData/extractEip712DomainTypes.js'

export { TypedData_hash as hash } from './internal/TypedData/hash.js'

export { TypedData_hashDomain as hashDomain } from './internal/TypedData/hashDomain.js'

export { TypedData_hashStruct as hashStruct } from './internal/TypedData/hashStruct.js'

export { TypedData_serialize as serialize } from './internal/TypedData/serialize.js'

export { TypedData_validate as validate } from './internal/TypedData/validate.js'
