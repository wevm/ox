import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const bytes = Bytes.random(32)
  expect(bytes).toHaveLength(32)
})
