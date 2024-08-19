import { expect, test } from 'vitest'

import { vToYParity } from './vToYParity.js'

test('default', () => {
  expect(vToYParity(0)).toBe(0)
  expect(vToYParity(1)).toBe(1)
  expect(vToYParity(27)).toBe(0)
  expect(vToYParity(28)).toBe(1)
  expect(vToYParity(35)).toBe(0)
  expect(vToYParity(36)).toBe(1)
  expect(() => vToYParity(34)).toThrow('Value `34` is an invalid v value.')
  expect(() => vToYParity(-1)).toThrow('Value `-1` is an invalid v value.')
})
