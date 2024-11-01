import { expect, test } from 'vitest'
import * as exports from './AbiItem.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "format",
      "from",
      "fromAbi",
      "getSelector",
      "getSignature",
      "getSignatureHash",
      "AmbiguityError",
      "NotFoundError",
      "InvalidSelectorSizeError",
    ]
  `)
})
