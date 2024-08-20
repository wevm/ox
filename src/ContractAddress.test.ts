import { expect, test } from 'vitest'
import * as exports from './ContractAddress.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "from",
      "getContractAddress",
      "getCreateAddress",
      "getCreate2Address",
    ]
  `)
})
