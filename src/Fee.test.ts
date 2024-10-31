import { Fee } from 'ox'
import { expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(Fee)).toMatchInlineSnapshot('[]')
})
