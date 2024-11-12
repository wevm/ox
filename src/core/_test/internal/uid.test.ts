import { expect, test } from 'vitest'

import { uid } from '../../internal/uid.js'

test('default', () => {
  expect(uid()).toBeTypeOf('string')
})
