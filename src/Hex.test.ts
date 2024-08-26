import { expect, test } from 'vitest'
import * as exports from './Hex.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "BytesSizeMismatchError",
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
      "assert",
      "concat",
      "isHex",
      "isEqual",
      "padLeft",
      "padRight",
      "slice",
      "size",
      "trimLeft",
      "trimRight",
      "to",
      "toBigInt",
      "toBoolean",
      "toBytes",
      "toNumber",
      "toString",
      "from",
      "fromBoolean",
      "fromBytes",
      "fromNumber",
      "fromString",
      "random",
    ]
  `)
})
