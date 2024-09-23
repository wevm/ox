import { expect, test } from 'vitest'
import * as Module from './Objects.js'

test('exports', () => {
  expect(Object.keys(Module)).toMatchInlineSnapshot(`
    [
      "mainnet",
    ]
  `)
})
