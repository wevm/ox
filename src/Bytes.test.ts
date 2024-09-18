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
      "isBytes",
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
      "from",
      "fromArray",
      "fromBoolean",
      "fromHex",
      "fromNumber",
      "fromString",
    ]
  `)
})
