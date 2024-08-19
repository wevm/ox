import { expect, test } from 'vitest'

import * as exports from './TypedData.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "extractEip712DomainTypes",
      "serializeTypedData",
      "serialize",
      "validateTypedData",
      "validate",
    ]
  `)
})
