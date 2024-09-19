import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.toNumber(Bytes.fromArray([0]))).toMatchInlineSnapshot('0')
  expect(Bytes.toNumber(Bytes.fromArray([7]))).toMatchInlineSnapshot('7')
  expect(Bytes.toNumber(Bytes.fromArray([69]))).toMatchInlineSnapshot('69')
  expect(Bytes.toNumber(Bytes.fromArray([1, 164]))).toMatchInlineSnapshot('420')
})

test('args: size', () => {
  expect(
    Bytes.toNumber(Bytes.fromNumber(420, { size: 32 }), {
      size: 32,
    }),
  ).toEqual(420)
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.toNumber(Bytes.fromNumber(69420, { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
      [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#bytessizeoverflowerror]
    `,
  )
})
