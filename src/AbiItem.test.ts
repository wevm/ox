import { expect, test } from 'vitest'
import * as exports from './AbiItem.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "AbiItemAmbiguityError",
      "decodeFunctionInput",
      "decodeFunctionOutput",
      "encodeFunctionInput",
      "encodeFunctionOutput",
      "extract",
      "getSelector",
      "getSignature",
      "getSignatureHash",
      "format",
      "from",
    ]
  `)
})
