import { expect, test } from 'vitest'
import * as exports from './Constants.test.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot('[]')
})
