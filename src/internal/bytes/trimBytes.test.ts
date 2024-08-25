import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.trimLeft(new Uint8Array([0, 0, 0, 0, 0]))).toMatchInlineSnapshot(
    `
    Uint8Array [
      0,
    ]
  `,
  )

  expect(
    Bytes.trimLeft(
      new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 1, 122, 51, 123,
      ]),
    ),
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
    Bytes.trimLeft(
      new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ]),
    ),
  ).toMatchInlineSnapshot(
    `
    Uint8Array [
      1,
    ]
  `,
  )

  expect(
    Bytes.trimLeft(
      new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 1, 122, 51, 123,
      ]),
    ),
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
    Bytes.trimRight(
      new Uint8Array([
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ]),
    ),
  ).toMatchInlineSnapshot(
    `
    Uint8Array [
      1,
    ]
  `,
  )

  expect(
    Bytes.trimRight(
      new Uint8Array([
        1, 122, 51, 123, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]),
    ),
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
    Bytes.trimRight(
      new Uint8Array([
        1, 122, 51, 123, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]),
    ),
  ).toMatchInlineSnapshot(
    `
    Uint8Array [
      1,
      122,
      51,
      123,
      11,
    ]
  `,
  )
})
