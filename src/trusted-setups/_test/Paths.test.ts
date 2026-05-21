import { expect, test } from 'vp/test'
import * as Module from '../Paths.js'

test('exports', () => {
  expect(Object.keys(Module)).toMatchInlineSnapshot(`
    [
      "mainnet",
    ]
  `)
})
