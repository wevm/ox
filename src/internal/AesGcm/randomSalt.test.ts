import { AesGcm } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const salt = AesGcm.randomSalt()
  expect(salt).toHaveLength(32)
})
