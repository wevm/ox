import { expect, test } from 'vitest'
import * as exports from './Block.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot('[]')
})
