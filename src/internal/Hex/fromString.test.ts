import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.fromString('')).toMatchInlineSnapshot('"0x"')
  expect(Hex.fromString('a')).toMatchInlineSnapshot('"0x61"')
  expect(Hex.fromString('abc')).toMatchInlineSnapshot('"0x616263"')
  expect(Hex.fromString('Hello World!')).toMatchInlineSnapshot(
    '"0x48656c6c6f20576f726c6421"',
  )
})

test('args: size', () => {
  expect(Hex.fromString('Hello World!', { size: 16 })).toMatchInlineSnapshot(
    '"0x48656c6c6f20576f726c642100000000"',
  )
  expect(Hex.fromString('Hello World!', { size: 32 })).toMatchInlineSnapshot(
    '"0x48656c6c6f20576f726c64210000000000000000000000000000000000000000"',
  )
})

test('error: size overflow', () => {
  expect(() =>
    Hex.fromString('Hello World!', { size: 8 }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.]',
  )
})
