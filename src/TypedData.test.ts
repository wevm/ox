import { expect, test } from 'vitest'

import * as exports from './TypedData.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "BytesSizeMismatchError",
      "InvalidPrimaryTypeError",
      "assert",
      "domainSeparator",
      "encodeType",
      "extractEip712DomainTypes",
      "encode",
      "getSignPayload",
      "hashDomain",
      "hashStruct",
      "serialize",
      "validate",
    ]
  `)
})
