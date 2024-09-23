import { expect, test } from 'vitest'
import * as exports from './Bytes.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidBytesBooleanError",
      "InvalidBytesTypeError",
      "SizeExceedsPaddingSizeError",
      "SizeOverflowError",
      "SliceOffsetOutOfBoundsError",
      "assert",
      "concat",
      "from",
      "fromArray",
      "fromBoolean",
      "fromHex",
      "fromNumber",
      "fromString",
      "isEqual",
      "padLeft",
      "padRight",
      "slice",
      "size",
      "trimLeft",
      "trimRight",
      "random",
      "toBigInt",
      "toBoolean",
      "toHex",
      "toNumber",
      "toString",
      "validate",
    ]
  `)
})
