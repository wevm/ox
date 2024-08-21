import { expect, test } from 'vitest'
import * as exports from './Blobs.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromBlobs",
      "to",
      "toBlobs",
      "from",
    ]
  `)
})
