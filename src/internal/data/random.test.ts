import { Data } from 'stdeth'
import { expect, test } from 'vitest'

test('randomBytes', () => {
  const bytes = Data.randomBytes(32)
  expect(bytes).toHaveLength(32)
})
