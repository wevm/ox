import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.toBoolean(Bytes.fromArray([0]))).toMatchInlineSnapshot('false')
  expect(Bytes.toBoolean(Bytes.fromArray([1]))).toMatchInlineSnapshot('true')
})

test('args: size', () => {
  expect(
    Bytes.toBoolean(Bytes.fromBoolean(true, { size: 32 }), {
      size: 32,
    }),
  ).toEqual(true)
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.toBoolean(Bytes.fromBoolean(true, { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
  )
})

test('error: invalid boolean', () => {
  expect(() =>
    Bytes.toBoolean(Bytes.fromArray([69])),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Bytes.InvalidBytesBooleanError: Bytes value \`69\` is not a valid boolean.

    The bytes array must contain a single byte of either a \`0\` or \`1\` value.]
  `,
  )
  expect(() =>
    Bytes.toBoolean(Bytes.fromArray([1, 2])),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Bytes.InvalidBytesBooleanError: Bytes value \`1,2\` is not a valid boolean.

    The bytes array must contain a single byte of either a \`0\` or \`1\` value.]
  `,
  )
})
