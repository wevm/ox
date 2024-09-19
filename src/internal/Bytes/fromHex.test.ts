import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.fromHex('0x')).toMatchInlineSnapshot('Uint8Array []')
  expect(Bytes.fromHex('0x61')).toMatchInlineSnapshot(`
        Uint8Array [
          97,
        ]
      `)
  expect(Bytes.fromHex('0x616263')).toMatchInlineSnapshot(
    `
        Uint8Array [
          97,
          98,
          99,
        ]
      `,
  )
  expect(Bytes.fromHex('0x48656c6c6f20576f726c6421')).toMatchInlineSnapshot(`
        Uint8Array [
          72,
          101,
          108,
          108,
          111,
          32,
          87,
          111,
          114,
          108,
          100,
          33,
        ]
      `)
})

test('args: size', () => {
  expect(
    Bytes.fromHex('0x48656c6c6f20576f726c6421', { size: 16 }),
  ).toMatchInlineSnapshot(`
      Uint8Array [
        72,
        101,
        108,
        108,
        111,
        32,
        87,
        111,
        114,
        108,
        100,
        33,
        0,
        0,
        0,
        0,
      ]
    `)
  expect(
    Bytes.fromHex('0x48656c6c6f20576f726c6421', { size: 32 }),
  ).toMatchInlineSnapshot(
    `
      Uint8Array [
        72,
        101,
        108,
        108,
        111,
        32,
        87,
        111,
        114,
        108,
        100,
        33,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ]
    `,
  )
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.fromHex('0x48656c6c6f20576f726c6421', { size: 8 }),
  ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`8\` bytes. Given size: \`12\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
})

test('error: invalid hex', () => {
  expect(() => Bytes.fromHex('0xabcdefgh')).toThrowErrorMatchingInlineSnapshot(
    `[BaseError: Invalid byte sequence ("gh" in "abcdefgh").]`,
  )
})

test('error: invalid length', () => {
  expect(() => Bytes.fromHex('0xabcde')).toThrowErrorMatchingInlineSnapshot(
    `
      [Hex.InvalidLengthError: Hex value \`"0xabcde"\` is an odd length (5 nibbles).

      It must be an even length.

      See: https://oxlib.sh/errors#bytesinvalidhexlengtherror]
    `,
  )
})
