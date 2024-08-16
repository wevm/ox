import { Data } from 'ox'
import { describe, expect, test } from 'vitest'

test('default', () => {
  expect(Data.padLeft('0xa4e12a45')).toMatchInlineSnapshot(
    '"0x00000000000000000000000000000000000000000000000000000000a4e12a45"',
  )

  expect(Data.padLeft(new Uint8Array([1, 122, 51, 123]))).toMatchInlineSnapshot(
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

  expect(Data.padRight('0xa4e12a45')).toMatchInlineSnapshot(
    `"0xa4e12a4500000000000000000000000000000000000000000000000000000000"`,
  )

  expect(
    Data.padRight(new Uint8Array([1, 122, 51, 123])),
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
})

describe('hex', () => {
  test('default', () => {
    expect(Data.padLeft('0x1')).toMatchInlineSnapshot(
      '"0x0000000000000000000000000000000000000000000000000000000000000001"',
    )

    expect(Data.padLeft('0xa4e12a45')).toMatchInlineSnapshot(
      '"0x00000000000000000000000000000000000000000000000000000000a4e12a45"',
    )

    expect(Data.padLeft('0x1a4e12a45')).toMatchInlineSnapshot(
      '"0x00000000000000000000000000000000000000000000000000000001a4e12a45"',
    )

    expect(() =>
      Data.padLeft(
        '0x1a4e12a45a21323123aaa87a897a897a898a6567a578a867a98778a667a85a875a87a6a787a65a675a6a9',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeExceedsPaddingSizeError: Hex size (\`43\`) exceeds padding size (\`32\`).

      See: https://oxlib.sh/errors#sizeexceedspaddingsizeerror]
    `,
    )
  })

  test('args: size', () => {
    expect(Data.padLeft('0x1', 4)).toMatchInlineSnapshot('"0x00000001"')

    expect(Data.padLeft('0xa4e12a45', 4)).toMatchInlineSnapshot('"0xa4e12a45"')

    expect(Data.padLeft('0xa4e12a45ab', 0)).toMatchInlineSnapshot(
      '"0xa4e12a45ab"',
    )

    expect(() =>
      Data.padLeft('0x1a4e12a45', 4),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeExceedsPaddingSizeError: Hex size (\`5\`) exceeds padding size (\`4\`).

      See: https://oxlib.sh/errors#sizeexceedspaddingsizeerror]
    `,
    )
  })
})

describe('bytes', () => {
  test('default', () => {
    expect(Data.padLeft(new Uint8Array([1]))).toMatchInlineSnapshot(
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
      Data.padLeft(new Uint8Array([1, 122, 51, 123])),
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
      Data.padLeft(
        new Uint8Array([
          1, 122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1,
          122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1,
          122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123,
        ]),
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeExceedsPaddingSizeError: Bytes size (\`44\`) exceeds padding size (\`32\`).

      See: https://oxlib.sh/errors#sizeexceedspaddingsizeerror]
    `,
    )
  })

  test('args: size', () => {
    expect(Data.padLeft(new Uint8Array([1]), 4)).toMatchInlineSnapshot(
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
      Data.padLeft(new Uint8Array([1, 122, 51, 123]), 4),
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
      Data.padLeft(new Uint8Array([1, 122, 51, 123, 11, 23]), 0),
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
      Data.padLeft(new Uint8Array([1, 122, 51, 123, 11]), 4),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeExceedsPaddingSizeError: Bytes size (\`5\`) exceeds padding size (\`4\`).

      See: https://oxlib.sh/errors#sizeexceedspaddingsizeerror]
    `,
    )
  })
})
