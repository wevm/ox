import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.fromBoolean(true)).toMatchInlineSnapshot(`
      Uint8Array [
        1,
      ]
    `)
  expect(Bytes.fromBoolean(false)).toMatchInlineSnapshot(`
      Uint8Array [
        0,
      ]
    `)
})

test('args: size', () => {
  expect(Bytes.fromBoolean(false, { size: 16 })).toMatchInlineSnapshot(
    `
      Uint8Array [
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
  expect(Bytes.fromBoolean(false, { size: 32 })).toMatchInlineSnapshot(
    `
      Uint8Array [
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
        0,
        0,
      ]
    `,
  )
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.fromBoolean(false, { size: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(`
      [Bytes.SizeOverflowError: Size cannot exceed \`0\` bytes. Given size: \`1\` bytes.

      See: https://oxlib.sh/errors#bytessizeoverflowerror]
    `)
})
