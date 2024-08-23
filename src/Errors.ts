export {
  InvalidAddressError,
  InvalidAddressInputError,
  InvalidAddressChecksumError,
} from './internal/errors/address.js'

export { BaseError } from './internal/errors/base.js'

export {
  NegativeOffsetError,
  PositionOutOfBoundsError,
  RecursiveReadLimitExceededError,
} from './internal/errors/cursor.js'

export {
  IntegerOutOfRangeError,
  InvalidBytesBooleanError,
  InvalidBytesTypeError,
  InvalidHexBooleanError,
  InvalidHexLengthError,
  InvalidHexTypeError,
  InvalidHexValueError,
  InvalidTypeError,
  SizeExceedsPaddingSizeError,
  SizeOverflowError,
  SliceOffsetOutOfBoundsError,
} from './internal/errors/data.js'

export type { GlobalErrorType } from './internal/errors/error.js'

export { SiweInvalidMessageFieldError } from './internal/errors/siwe.js'

export { InvalidPrimaryTypeError } from './internal/errors/typedData.js'
