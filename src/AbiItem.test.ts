import { expect, test } from 'vitest'
import * as exports from './AbiItem.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "AmbiguityError",
      "InvalidSelectorSizeError",
      "NotFoundError",
      "getSelector",
      "getSignature",
      "getSignatureHash",
      "format",
      "from",
      "fromAbi",
    ]
  `)
})
