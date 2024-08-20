import { expect, test } from 'vitest'

import * as exports from './TypedData.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "domainSeparator",
      "encodeType",
      "extractEip712DomainTypes",
      "hash",
      "hashTypedData",
      "hashDomain",
      "hashStruct",
      "serialize",
      "serializeTypedData",
      "validate",
      "validateTypedData",
    ]
  `)
})
