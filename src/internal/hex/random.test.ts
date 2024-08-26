import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const hex = Hex.random(32)
  expect(hex).toHaveLength(66)
})
