import { expect, test } from 'vp/test'

import { uid } from '../../internal/uid.js'

test('default', () => {
  expect(uid()).toBeTypeOf('string')
})
