import { expect, test } from 'vitest'
import * as Module from './Object.js'

test('exports', () => {
  expect(Object.keys(Module)).toMatchInlineSnapshot(`
    [
      "mainnet",
    ]
  `)
})
