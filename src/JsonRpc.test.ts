import { expect, test } from 'vitest'
import * as exports from './JsonRpc.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "defineRequest",
      "createRequestStore",
      "parseResponse",
    ]
  `)
})
