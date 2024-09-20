import { expect, test } from 'vitest'
import * as exports from './AesGcm.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "decrypt",
      "encrypt",
      "getKey",
      "randomSalt",
    ]
  `)
})
