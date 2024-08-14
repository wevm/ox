import { expect, test } from 'vitest'
import * as exports from './Errors.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "BaseError",
      "setErrorConfig",
      "NegativeOffsetError",
      "PositionOutOfBoundsError",
      "RecursiveReadLimitExceededError",
      "IntegerOutOfRangeError",
      "InvalidBytesBooleanError",
      "InvalidHexBooleanError",
      "InvalidHexValueError",
      "InvalidTypeError",
      "SizeExceedsPaddingSizeError",
      "SizeOverflowError",
      "SliceOffsetOutOfBoundsError",
    ]
  `)
})
