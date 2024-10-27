import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Bytes.padLeft(new Uint8Array([1, 122, 51, 123])),
  ).toMatchInlineSnapshot(
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
      1,
      122,
      51,
      123,
    ]
  `,
  )

  expect(
    Bytes.padRight(new Uint8Array([1, 122, 51, 123])),
  ).toMatchInlineSnapshot(
    `
    Uint8Array [
      1,
      122,
      51,
      123,
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

  expect(Bytes.padLeft(new Uint8Array([1]))).toMatchInlineSnapshot(
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
      1,
    ]
  `,
  )

  expect(
    Bytes.padLeft(new Uint8Array([1, 122, 51, 123])),
  ).toMatchInlineSnapshot(
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
      1,
      122,
      51,
      123,
    ]
  `,
  )

  expect(() =>
    Bytes.padLeft(
      new Uint8Array([
        1, 122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1,
        122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1, 122,
        51, 123, 1, 122, 51, 123, 1, 122, 51, 123,
      ]),
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SizeExceedsPaddingSizeError: Bytes size (`44`) exceeds padding size (`32`).]',
  )
})

test('args: size', () => {
  expect(Bytes.padLeft(new Uint8Array([1]), 4)).toMatchInlineSnapshot(
    `
    Uint8Array [
      0,
      0,
      0,
      1,
    ]
  `,
  )

  expect(
    Bytes.padLeft(new Uint8Array([1, 122, 51, 123]), 4),
  ).toMatchInlineSnapshot(
    `
    Uint8Array [
      1,
      122,
      51,
      123,
    ]
  `,
  )

  expect(
    Bytes.padLeft(new Uint8Array([1, 122, 51, 123, 11, 23]), 0),
  ).toMatchInlineSnapshot(
    `
    Uint8Array [
      1,
      122,
      51,
      123,
      11,
      23,
    ]
  `,
  )

  expect(() =>
    Bytes.padLeft(new Uint8Array([1, 122, 51, 123, 11]), 4),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SizeExceedsPaddingSizeError: Bytes size (`5`) exceeds padding size (`4`).]',
  )
})
