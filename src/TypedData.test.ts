import { expect, test } from 'vitest'

import * as exports from './TypedData.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "serializeTypedData",
      "serialize",
      "validateTypedData",
      "validate",
    ]
  `)
})
