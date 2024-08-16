import { expect, test } from 'vitest'
import * as exports from './Errors.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "BaseError",
      "NegativeOffsetError",
      "PositionOutOfBoundsError",
      "RecursiveReadLimitExceededError",
      "IntegerOutOfRangeError",
      "InvalidBytesBooleanError",
      "InvalidHexBooleanError",
      "InvalidHexLengthError",
      "InvalidTypeError",
      "SizeExceedsPaddingSizeError",
      "SizeOverflowError",
      "SliceOffsetOutOfBoundsError",
    ]
  `)
})
