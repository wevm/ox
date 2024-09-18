import { Bytes } from 'ox'
import { describe, expect, test } from 'vitest'

describe('bytes to number', () => {
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
      `
      [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#bytessizeoverflowerror]
    `,
    )
  })
})

describe('bytes to bigint', () => {
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
      `
      [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#bytessizeoverflowerror]
    `,
    )
  })
})

describe('bytes to boolean', () => {
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
      `
      [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#bytessizeoverflowerror]
    `,
    )
  })

  test('error: invalid boolean', () => {
    expect(() =>
      Bytes.toBoolean(Bytes.fromArray([69])),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Bytes.InvalidBytesBooleanError: Bytes value \`69\` is not a valid boolean.

      The bytes array must contain a single byte of either a \`0\` or \`1\` value.

      See: https://oxlib.sh/errors#bytesinvalidbytesbooleanerror]
    `,
    )
    expect(() =>
      Bytes.toBoolean(Bytes.fromArray([1, 2])),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Bytes.InvalidBytesBooleanError: Bytes value \`1,2\` is not a valid boolean.

      The bytes array must contain a single byte of either a \`0\` or \`1\` value.

      See: https://oxlib.sh/errors#bytesinvalidbytesbooleanerror]
    `,
    )
  })
})

describe('bytes to string', () => {
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
      `
      [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#bytessizeoverflowerror]
    `,
    )
  })
})

describe('bytes to hex', () => {
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
      `
      [Hex.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `,
    )
  })
})
