import { Bytes } from 'ox'
import { describe, expect, test } from 'vitest'

describe('numbers to bytes', () => {
  test('default', () => {
    expect(Bytes.fromNumber(0)).toMatchInlineSnapshot(`
      Uint8Array [
        0,
      ]
    `)
    expect(Bytes.fromNumber(7)).toMatchInlineSnapshot(`
      Uint8Array [
        7,
      ]
    `)
    expect(Bytes.fromNumber(69)).toMatchInlineSnapshot(`
      Uint8Array [
        69,
      ]
    `)
    expect(Bytes.fromNumber(420)).toMatchInlineSnapshot(`
      Uint8Array [
        1,
        164,
      ]
    `)

    expect(() => Bytes.fromNumber(-69)).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-69` is not in safe unsigned integer range (`0` to `9007199254740991`)]',
    )
  })

  test('args: size', () => {
    expect(Bytes.fromNumber(7, { size: 1 })).toMatchInlineSnapshot(`
      Uint8Array [
        7,
      ]
    `)
    expect(Bytes.fromNumber(10, { size: 2 })).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        10,
      ]
    `)
    expect(Bytes.fromNumber(0, { size: 4 })).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        0,
        0,
        0,
      ]
    `)
    expect(Bytes.fromNumber(69420, { size: 4 })).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        1,
        15,
        44,
      ]
    `)
    expect(Bytes.fromNumber(69420, { size: 32 })).toMatchInlineSnapshot(`
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
        1,
        15,
        44,
      ]
    `)

    expect(() =>
      Bytes.fromNumber(-7, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-7` is not in safe 8-bit unsigned integer range (`0` to `255`)]',
    )
    expect(() =>
      Bytes.fromNumber(256, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `256` is not in safe 8-bit unsigned integer range (`0` to `255`)]',
    )
    expect(() =>
      Bytes.fromNumber(65536, { size: 2 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `65536` is not in safe 16-bit unsigned integer range (`0` to `65535`)]',
    )
  })

  test('args: signed', () => {
    expect(
      Bytes.fromNumber(32, { size: 1, signed: true }),
    ).toMatchInlineSnapshot(
      `
      Uint8Array [
        32,
      ]
    `,
    )
    expect(
      Bytes.fromNumber(-32, {
        size: 1,
        signed: true,
      }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        224,
      ]
    `)
    expect(
      Bytes.fromNumber(-32, {
        size: 4,
        signed: true,
      }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        255,
        255,
        255,
        224,
      ]
    `)

    expect(
      Bytes.fromNumber(127, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(
      `
      Uint8Array [
        0,
        127,
      ]
    `,
    )
    expect(
      Bytes.fromNumber(-127, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        255,
        129,
      ]
    `)
    expect(
      Bytes.fromNumber(32767, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        127,
        255,
      ]
    `)
    expect(
      Bytes.fromNumber(-32768, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        128,
        0,
      ]
    `)
    expect(() =>
      Bytes.fromNumber(32768, { size: 2, signed: true }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `32768` is not in safe 16-bit signed integer range (`-32768` to `32767`)]',
    )
    expect(() =>
      Bytes.fromNumber(-32769, { size: 2, signed: true }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-32769` is not in safe 16-bit signed integer range (`-32768` to `32767`)]',
    )
  })
})

describe('bigints to bytes', () => {
  test('default', () => {
    expect(Bytes.fromNumber(0)).toMatchInlineSnapshot(`
      Uint8Array [
        0,
      ]
    `)
    expect(Bytes.fromNumber(7n)).toMatchInlineSnapshot(`
      Uint8Array [
        7,
      ]
    `)
    expect(Bytes.fromNumber(69n)).toMatchInlineSnapshot(`
      Uint8Array [
        69,
      ]
    `)
    expect(Bytes.fromNumber(420n)).toMatchInlineSnapshot(`
      Uint8Array [
        1,
        164,
      ]
    `)
    expect(
      Bytes.fromNumber(4206942069420694206942069420694206942069n),
    ).toMatchInlineSnapshot(`
        Uint8Array [
          12,
          92,
          243,
          146,
          17,
          135,
          111,
          181,
          229,
          136,
          67,
          39,
          250,
          86,
          252,
          11,
          117,
        ]
      `)
  })

  test('args: size', () => {
    expect(Bytes.fromNumber(7n, { size: 1 })).toMatchInlineSnapshot(`
      Uint8Array [
        7,
      ]
    `)
    expect(Bytes.fromNumber(10n, { size: 2 })).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        10,
      ]
    `)
    expect(Bytes.fromNumber(69n, { size: 4 })).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        0,
        0,
        69,
      ]
    `)
    expect(
      Bytes.fromNumber(6123123124124124213123129n, { size: 32 }),
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
        5,
        16,
        159,
        43,
        112,
        14,
        48,
        229,
        179,
        152,
        57,
      ]
    `,
    )

    expect(() =>
      Bytes.fromNumber(-7n, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-7n` is not in safe 8-bit unsigned integer range (`0n` to `255n`)]',
    )
    expect(() =>
      Bytes.fromNumber(256n, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `256n` is not in safe 8-bit unsigned integer range (`0n` to `255n`)]',
    )
    expect(() =>
      Bytes.fromNumber(65536n, { size: 2 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `65536n` is not in safe 16-bit unsigned integer range (`0n` to `65535n`)]',
    )
    expect(() =>
      Bytes.fromNumber(18446744073709551616n, { size: 8 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `18446744073709551616n` is not in safe 64-bit unsigned integer range (`0n` to `18446744073709551615n`)]',
    )
  })

  test('args: signed', () => {
    expect(
      Bytes.fromNumber(32n, { size: 1, signed: true }),
    ).toMatchInlineSnapshot(
      `
      Uint8Array [
        32,
      ]
    `,
    )
    expect(
      Bytes.fromNumber(-32n, {
        size: 1,
        signed: true,
      }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        224,
      ]
    `)
    expect(
      Bytes.fromNumber(-32n, {
        size: 4,
        signed: true,
      }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        255,
        255,
        255,
        224,
      ]
    `)

    expect(
      Bytes.fromNumber(127n, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        127,
      ]
    `)
    expect(
      Bytes.fromNumber(-127n, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        255,
        129,
      ]
    `)
    expect(
      Bytes.fromNumber(32767n, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        127,
        255,
      ]
    `)
    expect(
      Bytes.fromNumber(-32768n, { size: 2, signed: true }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        128,
        0,
      ]
    `)

    expect(
      Bytes.fromNumber(12312312312312312412n, { size: 32, signed: true }),
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
        170,
        222,
        30,
        208,
        139,
        11,
        50,
        92,
      ]
    `,
    )
    expect(
      Bytes.fromNumber(-12312312312312312412n, {
        size: 32,
        signed: true,
      }),
    ).toMatchInlineSnapshot(
      `
      Uint8Array [
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        85,
        33,
        225,
        47,
        116,
        244,
        205,
        164,
      ]
    `,
    )

    expect(() =>
      Bytes.fromNumber(170141183460469231731687303715884105728n, {
        size: 16,
        signed: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `170141183460469231731687303715884105728n` is not in safe 128-bit signed integer range (`-170141183460469231731687303715884105728n` to `170141183460469231731687303715884105727n`)]',
    )
    expect(() =>
      Bytes.fromNumber(-170141183460469231731687303715884105729n, {
        size: 16,
        signed: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-170141183460469231731687303715884105729n` is not in safe 128-bit signed integer range (`-170141183460469231731687303715884105728n` to `170141183460469231731687303715884105727n`)]',
    )
  })
})
