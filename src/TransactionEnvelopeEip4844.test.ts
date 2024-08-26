import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelopeEip4844.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "assert",
      "deserialize",
      "from",
      "getSignPayload",
      "hash",
      "serialize",
    ]
  `)
})
