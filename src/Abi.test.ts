import { expect, test } from 'vitest'
import * as exports from './Abi.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "getSelector",
      "getSignature",
      "getSignatureHash",
    ]
  `)
})
