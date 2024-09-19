import { Base58 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base58.fromString('Hello World!')).toBe('2NEpo7TZRRrLZSi2U')
  expect(
    Base58.fromString('The quick brown fox jumps over the lazy dog.'),
  ).toBe('USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z')
})
