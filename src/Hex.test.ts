import { expect, test } from 'vitest'
import * as exports from './Hex.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "IntegerOutOfRangeError",
      "InvalidHexBooleanError",
      "InvalidHexTypeError",
      "InvalidHexValueError",
      "InvalidLengthError",
      "SizeExceedsPaddingSizeError",
      "SizeOverflowError",
      "SliceOffsetOutOfBoundsError",
      "assert",
      "concat",
      "isEqual",
      "padLeft",
      "padRight",
      "slice",
      "size",
      "from",
      "fromBoolean",
      "fromBytes",
      "fromNumber",
      "fromString",
      "random",
      "toBigInt",
      "toBoolean",
      "toBytes",
      "toNumber",
      "toString",
      "trimLeft",
      "trimRight",
      "validate",
    ]
  `)
})
