import { expect, test } from 'vitest'
import * as exports from './ContractAddress.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "from",
      "fromCreate2",
    ]
  `)
})
