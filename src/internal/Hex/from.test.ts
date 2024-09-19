import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.from(new Uint8Array([251, 151, 22, 33]))).toBe('0xfb971621')
  expect(Hex.from('0xdeadbeef')).toBe('0xdeadbeef')
})
