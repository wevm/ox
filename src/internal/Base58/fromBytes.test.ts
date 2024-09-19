import { Base58 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Base58.fromBytes(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    ),
  ).toBe('2NEpo7TZRRrLZSi2U')
})
