import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.toBigInt(Bytes.fromArray([0]))).toMatchInlineSnapshot('0n')
  expect(Bytes.toBigInt(Bytes.fromArray([7]))).toMatchInlineSnapshot('7n')
  expect(Bytes.toBigInt(Bytes.fromArray([69]))).toMatchInlineSnapshot('69n')
  expect(Bytes.toBigInt(Bytes.fromArray([1, 164]))).toMatchInlineSnapshot(
    '420n',
  )
  expect(
    Bytes.toBigInt(
      Bytes.fromArray([
        12, 92, 243, 146, 17, 135, 111, 181, 229, 136, 67, 39, 250, 86, 252, 11,
        117,
      ]),
    ),
  ).toMatchInlineSnapshot('4206942069420694206942069420694206942069n')
})

test('args: size', () => {
  expect(
    Bytes.toBigInt(Bytes.fromNumber(420n, { size: 32 }), {
      size: 32,
    }),
  ).toEqual(420n)
  expect(
    Bytes.toBigInt(Bytes.fromNumber(420n, { size: 32 }), {
      size: 32,
    }),
  ).toEqual(420n)
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.toBigInt(Bytes.fromNumber(69420, { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

    See: https://oxlib.sh/errors#bytessizeoverflowerror]
  `,
  )
})
