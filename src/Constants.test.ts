import { expect, test } from 'vitest'
import * as exports from './Constants.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "arrayRegex",
      "bytesRegex",
      "integerRegex",
      "valueExponents",
    ]
  `)
})
