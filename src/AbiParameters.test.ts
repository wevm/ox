import { expect, test } from 'vitest'
import * as exports from './AbiParameters.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "ArrayLengthMismatchError",
      "BytesSizeMismatchError",
      "DataSizeTooSmallError",
      "InvalidArrayError",
      "InvalidTypeError",
      "LengthMismatchError",
      "ZeroDataError",
      "decode",
      "encode",
      "encodePacked",
      "format",
      "from",
    ]
  `)
})
