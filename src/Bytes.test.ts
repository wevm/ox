import { Bytes } from 'ox'
import { describe, expect, test } from 'vitest'

describe('assert', () => {
  test('default', () => {
    Bytes.assert(new Uint8Array([1, 69, 420]))
    expect(() =>
      Bytes.assert(new Uint16Array([1])),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Bytes.InvalidBytesTypeError: Value \`{"0":1}\` of type \`object\` is an invalid Bytes value.
  
      Bytes values must be of type \`Bytes\`.]
    `)
    expect(() => Bytes.assert('0x1')).toThrowErrorMatchingInlineSnapshot(`
      [Bytes.InvalidBytesTypeError: Value \`0x1\` of type \`string\` is an invalid Bytes value.
  
      Bytes values must be of type \`Bytes\`.]
    `)
    expect(() => Bytes.assert({})).toThrowErrorMatchingInlineSnapshot(`
      [Bytes.InvalidBytesTypeError: Value \`{}\` of type \`object\` is an invalid Bytes value.
  
      Bytes values must be of type \`Bytes\`.]
    `)
    expect(() => Bytes.assert(undefined)).toThrowErrorMatchingInlineSnapshot(`
      [Bytes.InvalidBytesTypeError: Value \`undefined\` of type \`undefined\` is an invalid Bytes value.
  
      Bytes values must be of type \`Bytes\`.]
    `)
  })
})

describe('concat', () => {
  test('default', () => {
    expect(
      Bytes.concat(new Uint8Array([0]), new Uint8Array([1])),
    ).toStrictEqual(new Uint8Array([0, 1]))
    expect(
      Bytes.concat(
        new Uint8Array([1]),
        new Uint8Array([69]),
        new Uint8Array([420, 69]),
      ),
    ).toStrictEqual(new Uint8Array([1, 69, 420, 69]))
    expect(
      Bytes.concat(
        new Uint8Array([0, 0, 0, 1]),
        new Uint8Array([0, 0, 0, 69]),
        new Uint8Array([0, 0, 420, 69]),
      ),
    ).toStrictEqual(new Uint8Array([0, 0, 0, 1, 0, 0, 0, 69, 0, 0, 420, 69]))
  })
})

describe('from', () => {
  test('default', () => {
    expect(Bytes.from([51, 12, 41, 55])).toMatchInlineSnapshot(
      `
      Uint8Array [
        51,
        12,
        41,
        55,
      ]
    `,
    )

    expect(Bytes.from(new Uint8Array([51, 12, 41, 55]))).toMatchInlineSnapshot(
      `
      Uint8Array [
        51,
        12,
        41,
        55,
      ]
    `,
    )

    expect(Bytes.from('0xdeadbeef')).toMatchInlineSnapshot(
      `
      Uint8Array [
        222,
        173,
        190,
        239,
      ]
    `,
    )
  })
})

describe('fromArray', () => {
  test('default', () => {
    expect(Bytes.fromArray([])).toMatchInlineSnapshot('Uint8Array []')
    expect(Bytes.fromArray([1, 2, 3, 4])).toMatchInlineSnapshot(`
        Uint8Array [
          1,
          2,
          3,
          4,
        ]
      `)
  })
})

describe('fromBoolean', () => {
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
    ).toThrowErrorMatchingInlineSnapshot(
      '[Bytes.SizeOverflowError: Size cannot exceed `0` bytes. Given size: `1` bytes.]',
    )
  })
})

describe('fromHex', () => {
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
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.]',
    )
  })

  test('error: invalid hex', () => {
    expect(() =>
      Bytes.fromHex('0xabcdefgh'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Invalid byte sequence ("gh" in "abcdefgh").]`,
    )
  })

  test('error: invalid length', () => {
    expect(() => Bytes.fromHex('0xabcde')).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.InvalidLengthError: Hex value \`"0xabcde"\` is an odd length (5 nibbles).
  
      It must be an even length.]
    `,
    )
  })
})

describe('fromNumber', () => {
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
})

describe('fromString', () => {
  test('default', () => {
    expect(Bytes.fromString('')).toMatchInlineSnapshot('Uint8Array []')
    expect(Bytes.fromString('a')).toMatchInlineSnapshot(`
        Uint8Array [
          97,
        ]
      `)
    expect(Bytes.fromString('abc')).toMatchInlineSnapshot(`
        Uint8Array [
          97,
          98,
          99,
        ]
      `)
    expect(Bytes.fromString('Hello World!')).toMatchInlineSnapshot(
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
        ]
      `,
    )
  })

  test('args: size', () => {
    expect(
      Bytes.fromString('Hello World!', { size: 16 }),
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
        ]
      `,
    )
    expect(
      Bytes.fromString('Hello World!', { size: 32 }),
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
      Bytes.fromString('Hello World!', { size: 8 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Bytes.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.]',
    )
  })
})

describe('isEqual', () => {
  test('default', () => {
    expect(
      Bytes.isEqual(new Uint8Array([1, 69, 420]), new Uint8Array([1, 69, 420])),
    ).toBeTruthy()
    expect(
      Bytes.isEqual(new Uint8Array([1, 69, 420]), new Uint8Array([1, 69, 421])),
    ).toBeFalsy()
  })
})

describe('padLeft', () => {
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
          122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123, 1,
          122, 51, 123, 1, 122, 51, 123, 1, 122, 51, 123,
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
})

describe('random', () => {
  test('default', () => {
    const bytes = Bytes.random(32)
    expect(bytes).toHaveLength(32)
  })
})

describe('size', () => {
  test('default', () => {
    expect(Bytes.size(new Uint8Array([]))).toBe(0)
    expect(Bytes.size(new Uint8Array([1]))).toBe(1)
    expect(Bytes.size(new Uint8Array([1, 2]))).toBe(2)
    expect(Bytes.size(new Uint8Array([1, 2, 3, 4]))).toBe(4)
  })
})

describe('slice', () => {
  test('default', () => {
    expect(Bytes.slice(new Uint8Array([]))).toMatchInlineSnapshot(
      'Uint8Array []',
    )
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ]
    `)

    expect(Bytes.slice(new Uint8Array([]), 0)).toMatchInlineSnapshot(
      'Uint8Array []',
    )
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 0, 4),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        1,
        2,
        3,
      ]
    `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 2, 8),
    ).toMatchInlineSnapshot(`
        Uint8Array [
          2,
          3,
          4,
          5,
          6,
          7,
        ]
      `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 5, 9),
    ).toMatchInlineSnapshot(`
        Uint8Array [
          5,
          6,
          7,
          8,
        ]
      `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 2),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ]
    `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 2),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ]
    `)

    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -1),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        9,
      ]
    `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -3, -1),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        7,
        8,
      ]
    `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -8),
    ).toMatchInlineSnapshot(`
        Uint8Array [
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
        ]
      `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -8),
    ).toMatchInlineSnapshot(`
        Uint8Array [
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
        ]
      `)

    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 0, 10),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ]
    `)
    expect(
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -10),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ]
    `)

    expect(() =>
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 10),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Bytes.SliceOffsetOutOfBoundsError: Slice starting at offset `10` is out-of-bounds (size: `10`).]',
    )

    expect(() =>
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 0, 11, {
        strict: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Bytes.SliceOffsetOutOfBoundsError: Slice ending at offset `11` is out-of-bounds (size: `10`).]',
    )
    expect(() =>
      Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 5, 15, {
        strict: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Bytes.SliceOffsetOutOfBoundsError: Slice ending at offset `15` is out-of-bounds (size: `5`).]',
    )
  })
})

describe('toBigInt', () => {
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
          12, 92, 243, 146, 17, 135, 111, 181, 229, 136, 67, 39, 250, 86, 252,
          11, 117,
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
      '[Bytes.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
    )
  })
})

describe('toBoolean', () => {
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
})

describe('toHex', () => {
  test('default', () => {
    expect(Bytes.toHex(Bytes.fromArray([97, 98, 99]))).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(Bytes.toHex(Bytes.fromArray([97]))).toMatchInlineSnapshot('"0x61"')
    expect(Bytes.toHex(Bytes.fromArray([97, 98, 99]))).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(
      Bytes.toHex(
        Bytes.fromArray([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c6421"')
  })

  test('args: size', () => {
    expect(
      Bytes.toHex(Bytes.fromHex('0x420696', { size: 32 }), {
        size: 32,
      }),
    ).toMatchInlineSnapshot(
      '"0x4206960000000000000000000000000000000000000000000000000000000000"',
    )
    expect(
      Bytes.toHex(Bytes.fromHex('0x420696', { size: 32 }), {
        size: 32,
      }),
    ).toMatchInlineSnapshot(
      '"0x4206960000000000000000000000000000000000000000000000000000000000"',
    )
  })

  test('error: size overflow', () => {
    expect(() =>
      Bytes.toHex(Bytes.fromHex('0x420696', { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
    )
  })
})

describe('toNumber', () => {
  test('default', () => {
    expect(Bytes.toNumber(Bytes.fromArray([0]))).toMatchInlineSnapshot('0')
    expect(Bytes.toNumber(Bytes.fromArray([7]))).toMatchInlineSnapshot('7')
    expect(Bytes.toNumber(Bytes.fromArray([69]))).toMatchInlineSnapshot('69')
    expect(Bytes.toNumber(Bytes.fromArray([1, 164]))).toMatchInlineSnapshot(
      '420',
    )
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
      '[Bytes.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
    )
  })
})

describe('toString', () => {
  test('default', () => {
    expect(Bytes.toString(Bytes.fromArray([]))).toMatchInlineSnapshot(`""`)
    expect(Bytes.toString(Bytes.fromArray([97]))).toMatchInlineSnapshot(`"a"`)
    expect(Bytes.toString(Bytes.fromArray([97, 98, 99]))).toMatchInlineSnapshot(
      `"abc"`,
    )
    expect(
      Bytes.toString(
        Bytes.fromArray([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toMatchInlineSnapshot(`"Hello World!"`)
  })

  test('args: size', () => {
    expect(
      Bytes.toString(Bytes.fromString('wagmi', { size: 32 }), {
        size: 32,
      }),
    ).toEqual('wagmi')
  })

  test('error: size overflow', () => {
    expect(() =>
      Bytes.toString(Bytes.fromString('wagmi', { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Bytes.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
    )
  })
})

describe('trim', () => {
  test('default', () => {
    expect(
      Bytes.trimLeft(new Uint8Array([0, 0, 0, 0, 0])),
    ).toMatchInlineSnapshot(
      `
      Uint8Array [
        0,
      ]
    `,
    )

    expect(
      Bytes.trimLeft(
        new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 1, 122, 51, 123,
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
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 1,
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
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 1, 122, 51, 123,
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
          1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
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
          1, 122, 51, 123, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
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
})

describe('validate', () => {
  expect(Bytes.validate(new Uint8Array([1, 69, 420])))
  expect(Bytes.validate('0x1')).toBeFalsy()
  expect(Bytes.validate({})).toBeFalsy()
  expect(Bytes.validate(undefined)).toBeFalsy()
})

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidBytesBooleanError",
      "InvalidBytesTypeError",
      "SizeExceedsPaddingSizeError",
      "SizeOverflowError",
      "SliceOffsetOutOfBoundsError",
      "assert",
      "concat",
      "from",
      "fromArray",
      "fromBoolean",
      "fromHex",
      "fromNumber",
      "fromString",
      "isEqual",
      "padLeft",
      "padRight",
      "slice",
      "size",
      "trimLeft",
      "trimRight",
      "random",
      "toBigInt",
      "toBoolean",
      "toHex",
      "toNumber",
      "toString",
      "validate",
    ]
  `)
})
