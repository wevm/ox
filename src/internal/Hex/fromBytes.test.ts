import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.fromBytes(new Uint8Array([]))).toMatchInlineSnapshot('"0x"')
  expect(Hex.fromBytes(new Uint8Array([97]))).toMatchInlineSnapshot('"0x61"')
  expect(Hex.fromBytes(new Uint8Array([97, 98, 99]))).toMatchInlineSnapshot(
    '"0x616263"',
  )
  expect(
    Hex.fromBytes(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    ),
  ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c6421"')
})

test('args: size', () => {
  expect(
    Hex.fromBytes(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
      {
        size: 16,
      },
    ),
  ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c642100000000"')
  expect(
    Hex.fromBytes(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
      {
        size: 32,
      },
    ),
  ).toMatchInlineSnapshot(
    '"0x48656c6c6f20576f726c64210000000000000000000000000000000000000000"',
  )
})

test('error: size overflow', () => {
  expect(() =>
    Hex.fromBytes(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
      {
        size: 8,
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`8\` bytes. Given size: \`12\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
})
