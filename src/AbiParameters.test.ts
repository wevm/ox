import { expect, test } from 'vitest'
import * as exports from './AbiParameters.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "AbiDecodingDataSizeTooSmallError",
      "AbiDecodingZeroDataError",
      "AbiEncodingArrayLengthMismatchError",
      "AbiEncodingBytesSizeMismatchError",
      "AbiEncodingInvalidArrayError",
      "AbiEncodingLengthMismatchError",
      "InvalidAbiTypeError",
      "decode",
      "encode",
      "encodePacked",
      "format",
      "from",
    ]
  `)
})
