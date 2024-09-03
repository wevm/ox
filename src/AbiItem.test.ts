import { expect, test } from 'vitest'
import * as exports from './AbiItem.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "AbiItemAmbiguityError",
      "extract",
      "getSelector",
      "getSignature",
      "getSignatureHash",
      "format",
      "from",
    ]
  `)
})
