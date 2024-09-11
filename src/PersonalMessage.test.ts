import { expect, test } from 'vitest'
import * as exports from './PersonalMessage.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "encode",
      "getSignPayload",
    ]
  `)
})
