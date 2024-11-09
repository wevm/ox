import { expect, test } from 'vitest'
import { from } from '../../internal/base58.js'

test('default', () => {
  expect(
    from(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    ),
  ).toBe('2NEpo7TZRRrLZSi2U')
  expect(from('0x00000000287fb4cd')).toBe('1111233QC4')
})
