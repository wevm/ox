import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.toHex(Bytes.fromArray([97, 98, 99]))).toMatchInlineSnapshot(
    '"0x616263"',
  )
  expect(Bytes.toHex(Bytes.fromArray([97]))).toMatchInlineSnapshot('"0x61"')
  expect(Bytes.toHex(Bytes.fromArray([97, 98, 99]))).toMatchInlineSnapshot(
    '"0x616263"',
  )
  expect(
    Bytes.toHex(
      Bytes.fromArray([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    ),
  ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c6421"')
})

test('args: size', () => {
  expect(
    Bytes.toHex(Bytes.fromHex('0x420696', { size: 32 }), {
      size: 32,
    }),
  ).toMatchInlineSnapshot(
    '"0x4206960000000000000000000000000000000000000000000000000000000000"',
  )
  expect(
    Bytes.toHex(Bytes.fromHex('0x420696', { size: 32 }), {
      size: 32,
    }),
  ).toMatchInlineSnapshot(
    '"0x4206960000000000000000000000000000000000000000000000000000000000"',
  )
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.toHex(Bytes.fromHex('0x420696', { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Hex.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

    See: https://oxlib.sh/errors#hexsizeoverflowerror]
  `,
  )
})
