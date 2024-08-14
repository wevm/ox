export {
  BaseError,
  type BaseErrorType,
  setErrorConfig,
} from './internal/errors/base.js'

export {
  NegativeOffsetError,
  type NegativeOffsetErrorType,
  PositionOutOfBoundsError,
  type PositionOutOfBoundsErrorType,
  RecursiveReadLimitExceededError,
  type RecursiveReadLimitExceededErrorType,
} from './internal/errors/cursor.js'

export {
  IntegerOutOfRangeError,
  type IntegerOutOfRangeErrorType,
  InvalidBytesBooleanError,
  type InvalidBytesBooleanErrorType,
  InvalidHexBooleanError,
  type InvalidHexBooleanErrorType,
  InvalidHexValueError,
  type InvalidHexValueErrorType,
  InvalidTypeError,
  type InvalidTypeErrorType,
  SizeExceedsPaddingSizeError,
  type SizeExceedsPaddingSizeErrorType,
  SizeOverflowError,
  type SizeOverflowErrorType,
  SliceOffsetOutOfBoundsError,
  type SliceOffsetOutOfBoundsErrorType,
} from './internal/errors/data.js'

export type { ErrorType } from './internal/errors/error.js'
