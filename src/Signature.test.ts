import { expect, test } from 'vitest'
import * as exports from './Signature.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "assert",
      "fromCompact",
      "deserialize",
      "extract",
      "fromTuple",
      "serialize",
      "toCompact",
      "from",
      "toTuple",
    ]
  `)
})
