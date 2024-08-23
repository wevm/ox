import { expect, test } from 'vitest'
import * as exports from './Errors.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidAddressError",
      "InvalidAddressInputError",
      "InvalidAddressChecksumError",
      "BaseError",
      "NegativeOffsetError",
      "PositionOutOfBoundsError",
      "RecursiveReadLimitExceededError",
      "IntegerOutOfRangeError",
      "InvalidBytesBooleanError",
      "InvalidBytesTypeError",
      "InvalidHexBooleanError",
      "InvalidHexLengthError",
      "InvalidHexTypeError",
      "InvalidHexValueError",
      "InvalidTypeError",
      "SizeExceedsPaddingSizeError",
      "SizeOverflowError",
      "SliceOffsetOutOfBoundsError",
      "SiweInvalidMessageFieldError",
      "InvalidPrimaryTypeError",
    ]
  `)
})
