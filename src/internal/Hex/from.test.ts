import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.from([0xde, 0xad, 0xbe, 0xef])).toBe('0xdeadbeef')
  expect(Hex.from(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('0xdeadbeef')
  expect(Hex.from('0xdeadbeef')).toBe('0xdeadbeef')
})
