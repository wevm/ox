import { expect, test } from 'vitest'
import * as exports from './Hex.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "IntegerOutOfRangeError",
      "InvalidHexBooleanError",
      "InvalidHexTypeError",
      "InvalidHexValueError",
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
      "trimLeft",
      "trimRight",
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
      "validate",
    ]
  `)
})
