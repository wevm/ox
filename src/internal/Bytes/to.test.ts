import { Bytes } from 'ox'
import { describe, expect, test } from 'vitest'

describe('bytes to number', () => {
  test('default', () => {
    expect(Bytes.to(Bytes.from([0]), 'number')).toMatchInlineSnapshot('0')
    expect(Bytes.to(Bytes.from([7]), 'number')).toMatchInlineSnapshot('7')
    expect(Bytes.to(Bytes.from([69]), 'number')).toMatchInlineSnapshot('69')
    expect(Bytes.to(Bytes.from([1, 164]), 'number')).toMatchInlineSnapshot(
      '420',
    )

    expect(Bytes.toNumber(Bytes.from([0]))).toMatchInlineSnapshot('0')
    expect(Bytes.toNumber(Bytes.from([7]))).toMatchInlineSnapshot('7')
    expect(Bytes.toNumber(Bytes.from([69]))).toMatchInlineSnapshot('69')
    expect(Bytes.toNumber(Bytes.from([1, 164]))).toMatchInlineSnapshot('420')
  })

  test('args: size', () => {
    expect(
      Bytes.to(Bytes.from(420, { size: 32 }), 'number', { size: 32 }),
    ).toEqual(420)
    expect(
      Bytes.toNumber(Bytes.from(420, { size: 32 }), {
        size: 32,
      }),
    ).toEqual(420)
  })

  test('error: size overflow', () => {
    expect(() =>
      Bytes.toNumber(Bytes.from(69420, { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `,
    )
  })
})

describe('bytes to bigint', () => {
  test('default', () => {
    expect(Bytes.to(Bytes.from([0]), 'bigint')).toMatchInlineSnapshot('0n')
    expect(Bytes.to(Bytes.from([7]), 'bigint')).toMatchInlineSnapshot('7n')
    expect(Bytes.to(Bytes.from([69]), 'bigint')).toMatchInlineSnapshot('69n')
    expect(Bytes.to(Bytes.from([1, 164]), 'bigint')).toMatchInlineSnapshot(
      '420n',
    )
    expect(
      Bytes.to(
        Bytes.from([
          12, 92, 243, 146, 17, 135, 111, 181, 229, 136, 67, 39, 250, 86, 252,
          11, 117,
        ]),
        'bigint',
      ),
    ).toMatchInlineSnapshot('4206942069420694206942069420694206942069n')

    expect(Bytes.toBigInt(Bytes.from([0]))).toMatchInlineSnapshot('0n')
    expect(Bytes.toBigInt(Bytes.from([7]))).toMatchInlineSnapshot('7n')
    expect(Bytes.toBigInt(Bytes.from([69]))).toMatchInlineSnapshot('69n')
    expect(Bytes.toBigInt(Bytes.from([1, 164]))).toMatchInlineSnapshot('420n')
    expect(
      Bytes.toBigInt(
        Bytes.from([
          12, 92, 243, 146, 17, 135, 111, 181, 229, 136, 67, 39, 250, 86, 252,
          11, 117,
        ]),
      ),
    ).toMatchInlineSnapshot('4206942069420694206942069420694206942069n')
  })

  test('args: size', () => {
    expect(
      Bytes.to(Bytes.from(420n, { size: 32 }), 'bigint', {
        size: 32,
      }),
    ).toEqual(420n)
    expect(
      Bytes.toBigInt(Bytes.from(420n, { size: 32 }), {
        size: 32,
      }),
    ).toEqual(420n)
  })

  test('error: size overflow', () => {
    expect(() =>
      Bytes.toBigInt(Bytes.from(69420, { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `,
    )
  })
})

describe('bytes to boolean', () => {
  test('default', () => {
    expect(Bytes.to(Bytes.from([0]), 'boolean')).toMatchInlineSnapshot('false')
    expect(Bytes.to(Bytes.from([1]), 'boolean')).toMatchInlineSnapshot('true')

    expect(Bytes.toBoolean(Bytes.from([0]))).toMatchInlineSnapshot('false')
    expect(Bytes.toBoolean(Bytes.from([1]))).toMatchInlineSnapshot('true')
  })

  test('args: size', () => {
    expect(
      Bytes.to(Bytes.from(true, { size: 32 }), 'boolean', {
        size: 32,
      }),
    ).toEqual(true)
    expect(
      Bytes.toBoolean(Bytes.from(true, { size: 32 }), {
        size: 32,
      }),
    ).toEqual(true)
  })

  test('error: size overflow', () => {
    expect(() =>
      Bytes.toBoolean(Bytes.from(true, { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `,
    )
  })

  test('error: invalid boolean', () => {
    expect(() =>
      Bytes.toBoolean(Bytes.from([69])),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [InvalidBytesBooleanError: Bytes value \`69\` is not a valid boolean.

      The bytes array must contain a single byte of either a \`0\` or \`1\` value.

      See: https://oxlib.sh/errors#invalidbytesbooleanerror]
    `,
    )
    expect(() =>
      Bytes.toBoolean(Bytes.from([1, 2])),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [InvalidBytesBooleanError: Bytes value \`1,2\` is not a valid boolean.

      The bytes array must contain a single byte of either a \`0\` or \`1\` value.

      See: https://oxlib.sh/errors#invalidbytesbooleanerror]
    `,
    )
  })
})

describe('bytes to string', () => {
  test('default', () => {
    expect(Bytes.to(Bytes.from([]), 'string')).toMatchInlineSnapshot(`""`)
    expect(Bytes.to(Bytes.from([97]), 'string')).toMatchInlineSnapshot(`"a"`)
    expect(Bytes.to(Bytes.from([97, 98, 99]), 'string')).toMatchInlineSnapshot(
      `"abc"`,
    )
    expect(
      Bytes.to(
        Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
        'string',
      ),
    ).toMatchInlineSnapshot(`"Hello World!"`)

    expect(Bytes.toString(Bytes.from([]))).toMatchInlineSnapshot(`""`)
    expect(Bytes.toString(Bytes.from([97]))).toMatchInlineSnapshot(`"a"`)
    expect(Bytes.toString(Bytes.from([97, 98, 99]))).toMatchInlineSnapshot(
      `"abc"`,
    )
    expect(
      Bytes.toString(
        Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
      ),
    ).toMatchInlineSnapshot(`"Hello World!"`)
  })

  test('args: size', () => {
    expect(
      Bytes.to(Bytes.from('wagmi', { size: 32 }), 'string', {
        size: 32,
      }),
    ).toEqual('wagmi')
    expect(
      Bytes.toString(Bytes.from('wagmi', { size: 32 }), {
        size: 32,
      }),
    ).toEqual('wagmi')
  })

  test('error: size overflow', () => {
    expect(() =>
      Bytes.toString(Bytes.from('wagmi', { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `,
    )
  })
})

describe('bytes to hex', () => {
  test('default', () => {
    expect(Bytes.to(Bytes.from([97, 98, 99]), 'Hex')).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(Bytes.to(Bytes.from([97]), 'Hex')).toMatchInlineSnapshot('"0x61"')
    expect(Bytes.to(Bytes.from([97, 98, 99]), 'Hex')).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(
      Bytes.to(
        Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
        'Hex',
      ),
    ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c6421"')

    expect(Bytes.toHex(Bytes.from([97, 98, 99]))).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(Bytes.toHex(Bytes.from([97]))).toMatchInlineSnapshot('"0x61"')
    expect(Bytes.toHex(Bytes.from([97, 98, 99]))).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(
      Bytes.toHex(
        Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
      ),
    ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c6421"')
  })

  test('args: size', () => {
    expect(
      Bytes.to(Bytes.from('0x420696', { size: 32 }), 'Hex', {
        size: 32,
      }),
    ).toMatchInlineSnapshot(
      '"0x4206960000000000000000000000000000000000000000000000000000000000"',
    )
    expect(
      Bytes.toHex(Bytes.from('0x420696', { size: 32 }), {
        size: 32,
      }),
    ).toMatchInlineSnapshot(
      '"0x4206960000000000000000000000000000000000000000000000000000000000"',
    )
  })

  test('error: size overflow', () => {
    expect(() =>
      Bytes.toHex(Bytes.from('0x420696', { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `,
    )
  })
})

test('error: invalid `to`', () => {
  // @ts-expect-error
  expect(() => Bytes.to(420, 'fake')).toThrowErrorMatchingInlineSnapshot(
    `
    [InvalidTypeError: Type \`fake\` is invalid. Expected: \`string | Hex | bigint | number | boolean\`

    See: https://oxlib.sh/errors#invalidtypeerror]
  `,
  )
})
