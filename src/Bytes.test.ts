import { expect, test } from 'vitest'
import * as exports from './Bytes.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidBytesBooleanError",
      "InvalidBytesTypeError",
      "InvalidTypeError",
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
      "to",
      "toBigInt",
      "toBoolean",
      "toHex",
      "toNumber",
      "toString",
      "from",
      "fromBoolean",
      "fromHex",
      "fromNumber",
      "fromString",
    ]
  `)
})
