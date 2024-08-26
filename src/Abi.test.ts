import { expect, test } from 'vitest'
import * as exports from './Abi.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "AbiDecodingDataSizeTooSmallError",
      "AbiDecodingZeroDataError",
      "AbiEncodingArrayLengthMismatchError",
      "AbiEncodingBytesSizeMismatchError",
      "AbiEncodingInvalidArrayError",
      "AbiEncodingLengthMismatchError",
      "AbiItemAmbiguityError",
      "InvalidAbiTypeError",
      "encodeParameters",
      "encodePacked",
      "decodeParameters",
      "extractItem",
      "getSelector",
      "getSignature",
      "getSignatureHash",
    ]
  `)
})
