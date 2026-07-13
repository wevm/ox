import { expect, test } from 'vp/test'
import * as Module from '../index.js'

test('exports', () => {
  expect(Object.keys(Module)).toMatchInlineSnapshot(`
    [
      "Paths",
    ]
  `)
})
