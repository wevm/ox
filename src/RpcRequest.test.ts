import { expect, test } from 'vitest'
import * as exports from './RpcRequest.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "createStore",
      "from",
    ]
  `)
})
