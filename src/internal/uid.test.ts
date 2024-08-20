import { expect, test } from 'vitest'

import { uid } from './uid.js'

test('default', () => {
  expect(uid()).toBeTypeOf('string')
})
