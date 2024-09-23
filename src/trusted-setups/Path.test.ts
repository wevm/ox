import { expect, test } from 'vitest'
import * as Module from './Path.js'

test('exports', () => {
  expect(Object.keys(Module)).toMatchInlineSnapshot(`
    [
      "mainnet",
    ]
  `)
})
