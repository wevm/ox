export { BaseError } from './internal/errors/base.js'

export {
  NegativeOffsetError,
  PositionOutOfBoundsError,
  RecursiveReadLimitExceededError,
} from './internal/errors/cursor.js'

export {
  IntegerOutOfRangeError,
  InvalidBytesBooleanError,
  InvalidHexBooleanError,
  InvalidHexLengthError,
  InvalidTypeError,
  SizeExceedsPaddingSizeError,
  SizeOverflowError,
  SliceOffsetOutOfBoundsError,
} from './internal/errors/data.js'

export type { GlobalErrorType } from './internal/errors/error.js'
