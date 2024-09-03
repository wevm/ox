import { expect, test } from 'vitest'

import { Signature_vToYParity } from './vToYParity.js'

test('default', () => {
  expect(Signature_vToYParity(0)).toBe(0)
  expect(Signature_vToYParity(1)).toBe(1)
  expect(Signature_vToYParity(27)).toBe(0)
  expect(Signature_vToYParity(28)).toBe(1)
  expect(Signature_vToYParity(35)).toBe(0)
  expect(Signature_vToYParity(36)).toBe(1)
  expect(() => Signature_vToYParity(34)).toThrow(
    'Value `34` is an invalid v value.',
  )
  expect(() => Signature_vToYParity(-1)).toThrow(
    'Value `-1` is an invalid v value.',
  )
})
