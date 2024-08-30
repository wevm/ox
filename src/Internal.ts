export {
  type TupleAbiParameter,
  decodeAddress,
  decodeArray,
  decodeBool,
  decodeBytes,
  decodeNumber,
  decodeParameter,
  decodeString,
  decodeTuple,
  hasDynamicChild,
} from './internal/abi/decodeParameters.js'

export {
  type IsomorphicAbiParameter,
  type IsomorphicAbiParametersToPrimitiveTypes,
  type PreparedParameter,
  type Tuple,
  encode,
  encodeAddress,
  encodeArray,
  encodeBoolean,
  encodeBytes,
  encodeNumber,
  encodeString,
  encodeTuple,
  getArrayComponents,
  prepareParameter,
  prepareParameters,
} from './internal/abi/encodeParameters.js'

export {
  AbiDecodingDataSizeTooSmallError,
  AbiDecodingZeroDataError,
  AbiEncodingArrayLengthMismatchError,
  AbiEncodingBytesSizeMismatchError,
  AbiEncodingInvalidArrayError,
  AbiEncodingLengthMismatchError,
  AbiItemAmbiguityError,
  InvalidAbiTypeError,
} from './internal/abi/errors.js'

export { pad as pad_hex } from './internal/hex/pad.js'

export { pad as pad_bytes } from './internal/bytes/pad.js'

export type {
  EncodePackedValues,
  PackedAbiType,
} from './internal/abi/encodePacked.js'

export { normalizeSignature } from './internal/abi/getSignature.js'

export { type Cursor, createCursor } from './internal/cursor.js'

export { LruMap } from './internal/lru.js'

export {
  assertStartOffset as assertStartOffset_bytes,
  assertEndOffset as assertEndOffset_bytes,
} from './internal/bytes/slice.js'
export {
  assertStartOffset as assertStartOffset_hex,
  assertEndOffset as assertEndOffset_hex,
} from './internal/hex/slice.js'

export { trim as trim_hex } from './internal/hex/trim.js'
export { trim as trim_bytes } from './internal/bytes/trim.js'

export {
  decodeRlpCursor,
  readLength,
  readList,
} from './internal/rlp/to.js'

export {
  TransactionEnvelope_getType,
  type MatchKeys,
  type TransactionEnvelope_Generic,
  type BaseProperties,
  type Eip1559Properties,
  type Eip2930Properties,
  type Eip4844Properties,
  type Eip7702Properties,
  type TransactionEnvelope_GetType,
  type TransactionEnvelope_GetTypeFromObject,
  type TransactionEnvelope_GetTypeFromSerialized,
  type LegacyProperties,
} from './internal/transactionEnvelope/isomorphic/getType.js'

export { Signature_vToYParity } from './internal/signature/vToYParity.js'

export { findTypeDependencies } from './internal/typedData/encodeType.js'

export {
  encodeData,
  encodeField,
  hashType,
} from './internal/typedData/hashStruct.js'

export { stringify } from './internal/stringify.js'

export type {
  Abi_ItemArgs,
  Abi_ItemName,
  Abi_ExtractItem,
  Abi_ExtractItemNames,
  Abi_ExtractItemForArgs,
  Widen,
} from './internal/abi/types.js'

export type {
  Assign,
  Assign_inner,
  Branded,
  Compute,
  ExactPartial,
  IsNarrowable,
  IsNever,
  IsUnion,
  IsUnknown,
  KeyofUnion,
  LastInUnion,
  Omit,
  OneOf,
  PartialBy,
  Undefined,
  UnionCompute,
  UnionPartialBy,
  UnionToIntersection,
  UnionToTuple,
  ValueOf,
} from './internal/types.js'

export { Bytes_assertSize } from './internal/bytes/assertSize.js'

export { Hex_assertSize } from './internal/hex/assertSize.js'
