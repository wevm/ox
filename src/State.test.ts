import { expect, test } from 'vitest'
import * as exports from './State.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot('[]')
})
