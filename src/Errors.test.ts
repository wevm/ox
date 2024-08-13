import { expect, test } from 'vitest'
import * as exports from './Errors.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot('[]')
})
