import { expect, test } from 'vp/test'
import * as exports from '../index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "SignatureErc8010",
    ]
  `)
})
