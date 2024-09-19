import { Base58 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base58.toString('2NEpo7TZRRrLZSi2U')).toBe('Hello World!')
  expect(
    Base58.toString(
      'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z',
    ),
  ).toBe('The quick brown fox jumps over the lazy dog.')
})
