import { Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.toBytes('0x')).toMatchInlineSnapshot('Uint8Array []')
  expect(Hex.toBytes('0x61')).toMatchInlineSnapshot(`
    Uint8Array [
      97,
    ]
  `)
  expect(Hex.toBytes('0x616263')).toMatchInlineSnapshot(
    `
    Uint8Array [
      97,
      98,
      99,
    ]
  `,
  )
  expect(Hex.toBytes('0x48656c6c6f20576f726c6421')).toMatchInlineSnapshot(`
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
    Hex.toBytes(Hex.fromBytes(Bytes.fromArray([69, 420]), { size: 32 }), {
      size: 32,
    }),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      69,
      164,
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
  `)
  expect(
    Hex.toBytes(Hex.fromBytes(Bytes.fromArray([69, 420]), { size: 32 }), {
      size: 32,
    }),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      69,
      164,
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
  `)
})

test('error: size overflow', () => {
  expect(() =>
    Hex.toString(Hex.fromBytes(Bytes.fromArray([69, 420]), { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

    See: https://oxlib.sh/errors#bytessizeoverflowerror]
  `)
})

test('error: invalid bytes', () => {
  expect(() => Hex.toBytes('0x420fggf11a')).toThrowErrorMatchingInlineSnapshot(
    `[BaseError: Invalid byte sequence ("gg" in "420fggf11a").]`,
  )
})
