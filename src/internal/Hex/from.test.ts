import { Hex } from 'ox'
import { describe, expect, test } from 'vitest'

describe('numbers to hex', () => {
  test('default', () => {
    expect(Hex.from(0)).toMatchInlineSnapshot(`"0x00"`)
    expect(Hex.from(7)).toMatchInlineSnapshot(`"0x07"`)
    expect(Hex.from(69)).toMatchInlineSnapshot('"0x45"')
    expect(Hex.from(420)).toMatchInlineSnapshot(`"0x01a4"`)

    expect(Hex.fromNumber(0)).toMatchInlineSnapshot(`"0x00"`)
    expect(Hex.fromNumber(7)).toMatchInlineSnapshot(`"0x07"`)
    expect(Hex.fromNumber(69)).toMatchInlineSnapshot('"0x45"')
    expect(Hex.fromNumber(420)).toMatchInlineSnapshot(`"0x01a4"`)

    expect(() =>
      // biome-ignore lint/correctness/noPrecisionLoss: precision loss expected for test
      Hex.fromNumber(420182738912731283712937129),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`4.2018273891273126e+26\` is not in safe unsigned integer range (\`0\` to \`9007199254740991\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() => Hex.fromNumber(-69)).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`-69\` is not in safe unsigned integer range (\`0\` to \`9007199254740991\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
  })

  test('args: size', () => {
    expect(Hex.fromNumber(7, { size: 1 })).toBe('0x07')
    expect(Hex.fromNumber(10, { size: 2 })).toBe('0x000a')
    expect(Hex.fromNumber(69, { size: 4 })).toBe('0x00000045')
    expect(Hex.fromNumber(69, { size: 32 })).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000045',
    )

    expect(() =>
      Hex.fromNumber(-7, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`-7\` is not in safe 8-bit unsigned integer range (\`0\` to \`255\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() =>
      Hex.fromNumber(256, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`256\` is not in safe 8-bit unsigned integer range (\`0\` to \`255\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() =>
      Hex.fromNumber(65536, { size: 2 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`65536\` is not in safe 16-bit unsigned integer range (\`0\` to \`65535\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
  })

  test('args: signed', () => {
    expect(Hex.fromNumber(32, { size: 1, signed: true })).toBe('0x20')
    expect(
      Hex.fromNumber(-32, {
        size: 1,
        signed: true,
      }),
    ).toBe('0xe0')
    expect(
      Hex.fromNumber(-32, {
        size: 4,
        signed: true,
      }),
    ).toBe('0xffffffe0')

    expect(Hex.fromNumber(127, { size: 2, signed: true })).toBe('0x007f')
    expect(Hex.fromNumber(-127, { size: 2, signed: true })).toBe('0xff81')
    expect(Hex.fromNumber(32767, { size: 2, signed: true })).toBe('0x7fff')
    expect(Hex.fromNumber(-32768, { size: 2, signed: true })).toBe('0x8000')
    expect(() =>
      Hex.fromNumber(32768, { size: 2, signed: true }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`32768\` is not in safe 16-bit signed integer range (\`-32768\` to \`32767\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() =>
      Hex.fromNumber(-32769, { size: 2, signed: true }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`-32769\` is not in safe 16-bit signed integer range (\`-32768\` to \`32767\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
  })
})

describe('bigints to hex', () => {
  test('default', () => {
    expect(Hex.from(0)).toMatchInlineSnapshot(`"0x00"`)
    expect(Hex.from(7n)).toMatchInlineSnapshot(`"0x07"`)
    expect(Hex.from(69n)).toMatchInlineSnapshot('"0x45"')
    expect(Hex.from(420n)).toMatchInlineSnapshot(`"0x01a4"`)
    expect(
      Hex.from(4206942069420694206942069420694206942069n),
    ).toMatchInlineSnapshot(`"0x0c5cf39211876fb5e5884327fa56fc0b75"`)

    expect(Hex.fromNumber(0)).toMatchInlineSnapshot(`"0x00"`)
    expect(Hex.fromNumber(7n)).toMatchInlineSnapshot(`"0x07"`)
    expect(Hex.fromNumber(69n)).toMatchInlineSnapshot('"0x45"')
    expect(Hex.fromNumber(420n)).toMatchInlineSnapshot(`"0x01a4"`)
    expect(
      Hex.fromNumber(4206942069420694206942069420694206942069n),
    ).toMatchInlineSnapshot(`"0x0c5cf39211876fb5e5884327fa56fc0b75"`)

    expect(() => Hex.fromNumber(-69n)).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`-69n\` is not in safe unsigned integer range (above \`0n\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
  })

  test('args: size', () => {
    expect(Hex.fromNumber(7n, { size: 1 })).toBe('0x07')
    expect(Hex.fromNumber(10n, { size: 2 })).toBe('0x000a')
    expect(Hex.fromNumber(69n, { size: 4 })).toBe('0x00000045')
    expect(Hex.fromNumber(6123123124124124213123129n, { size: 32 })).toBe(
      '0x00000000000000000000000000000000000000000005109f2b700e30e5b39839',
    )

    expect(() =>
      Hex.fromNumber(-7n, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`-7n\` is not in safe 8-bit unsigned integer range (\`0n\` to \`255n\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() =>
      Hex.fromNumber(256n, { size: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`256n\` is not in safe 8-bit unsigned integer range (\`0n\` to \`255n\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() =>
      Hex.fromNumber(65536n, { size: 2 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`65536n\` is not in safe 16-bit unsigned integer range (\`0n\` to \`65535n\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() =>
      Hex.fromNumber(18446744073709551616n, { size: 8 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`18446744073709551616n\` is not in safe 64-bit unsigned integer range (\`0n\` to \`18446744073709551615n\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
  })

  test('args: signed', () => {
    expect(Hex.fromNumber(32n, { size: 1, signed: true })).toBe('0x20')
    expect(
      Hex.fromNumber(-32n, {
        size: 1,
        signed: true,
      }),
    ).toBe('0xe0')
    expect(
      Hex.fromNumber(-32n, {
        size: 4,
        signed: true,
      }),
    ).toBe('0xffffffe0')

    expect(Hex.fromNumber(127n, { size: 2, signed: true })).toBe('0x007f')
    expect(Hex.fromNumber(-127n, { size: 2, signed: true })).toBe('0xff81')
    expect(Hex.fromNumber(32767n, { size: 2, signed: true })).toBe('0x7fff')
    expect(Hex.fromNumber(-32768n, { size: 2, signed: true })).toBe('0x8000')

    expect(
      Hex.fromNumber(12312312312312312412n, { size: 32, signed: true }),
    ).toBe('0x000000000000000000000000000000000000000000000000aade1ed08b0b325c')
    expect(
      Hex.fromNumber(-12312312312312312412n, { size: 32, signed: true }),
    ).toBe('0xffffffffffffffffffffffffffffffffffffffffffffffff5521e12f74f4cda4')

    expect(() =>
      Hex.fromNumber(170141183460469231731687303715884105728n, {
        size: 16,
        signed: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`170141183460469231731687303715884105728n\` is not in safe 128-bit signed integer range (\`-170141183460469231731687303715884105728n\` to \`170141183460469231731687303715884105727n\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
    expect(() =>
      Hex.fromNumber(-170141183460469231731687303715884105729n, {
        size: 16,
        signed: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.IntegerOutOfRangeError: Number \`-170141183460469231731687303715884105729n\` is not in safe 128-bit signed integer range (\`-170141183460469231731687303715884105728n\` to \`170141183460469231731687303715884105727n\`)

      See: https://oxlib.sh/errors#hexintegeroutofrangeerror]
    `,
    )
  })
})

describe('boolean to hex', () => {
  test('default', () => {
    expect(Hex.from(true)).toMatchInlineSnapshot(`"0x01"`)
    expect(Hex.from(false)).toMatchInlineSnapshot(`"0x00"`)

    expect(Hex.fromBoolean(true)).toMatchInlineSnapshot(`"0x01"`)
    expect(Hex.fromBoolean(false)).toMatchInlineSnapshot(`"0x00"`)
  })

  test('args: size', () => {
    expect(Hex.from(true, { size: 16 })).toMatchInlineSnapshot(
      '"0x00000000000000000000000000000001"',
    )
    expect(Hex.from(true, { size: 32 })).toMatchInlineSnapshot(
      '"0x0000000000000000000000000000000000000000000000000000000000000001"',
    )
    expect(Hex.fromBoolean(false, { size: 16 })).toMatchInlineSnapshot(
      '"0x00000000000000000000000000000000"',
    )
    expect(Hex.fromBoolean(false, { size: 32 })).toMatchInlineSnapshot(
      '"0x0000000000000000000000000000000000000000000000000000000000000000"',
    )
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.from(true, { size: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.SizeOverflowError: Size cannot exceed \`0\` bytes. Given size: \`1\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `,
    )
    expect(() =>
      Hex.fromBoolean(false, { size: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`0\` bytes. Given size: \`1\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
  })
})

describe('string to hex', () => {
  test('default', () => {
    expect(Hex.from('')).toMatchInlineSnapshot('"0x"')
    expect(Hex.from('a')).toMatchInlineSnapshot('"0x61"')
    expect(Hex.from('abc')).toMatchInlineSnapshot('"0x616263"')
    expect(Hex.from('Hello World!')).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c6421"',
    )

    expect(Hex.fromString('')).toMatchInlineSnapshot('"0x"')
    expect(Hex.fromString('a')).toMatchInlineSnapshot('"0x61"')
    expect(Hex.fromString('abc')).toMatchInlineSnapshot('"0x616263"')
    expect(Hex.fromString('Hello World!')).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c6421"',
    )
  })

  test('args: size', () => {
    expect(Hex.from('Hello World!', { size: 16 })).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c642100000000"',
    )
    expect(Hex.from('Hello World!', { size: 32 })).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c64210000000000000000000000000000000000000000"',
    )
    expect(Hex.fromString('Hello World!', { size: 16 })).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c642100000000"',
    )
    expect(Hex.fromString('Hello World!', { size: 32 })).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c64210000000000000000000000000000000000000000"',
    )
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.from('Hello World!', { size: 8 }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`8\` bytes. Given size: \`12\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
    expect(() =>
      Hex.fromString('Hello World!', { size: 8 }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`8\` bytes. Given size: \`12\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
  })
})

describe('bytes to hex', () => {
  test('default', () => {
    expect(Hex.from(new Uint8Array([]))).toMatchInlineSnapshot('"0x"')
    expect(Hex.from(new Uint8Array([97]))).toMatchInlineSnapshot('"0x61"')
    expect(Hex.from(new Uint8Array([97, 98, 99]))).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(
      Hex.from(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c6421"')

    expect(Hex.fromBytes(new Uint8Array([]))).toMatchInlineSnapshot('"0x"')
    expect(Hex.fromBytes(new Uint8Array([97]))).toMatchInlineSnapshot('"0x61"')
    expect(Hex.fromBytes(new Uint8Array([97, 98, 99]))).toMatchInlineSnapshot(
      '"0x616263"',
    )
    expect(
      Hex.fromBytes(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c6421"')
  })

  test('args: size', () => {
    expect(
      Hex.from(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        {
          size: 16,
        },
      ),
    ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c642100000000"')
    expect(
      Hex.fromBytes(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        {
          size: 16,
        },
      ),
    ).toMatchInlineSnapshot('"0x48656c6c6f20576f726c642100000000"')
    expect(
      Hex.from(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        {
          size: 32,
        },
      ),
    ).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c64210000000000000000000000000000000000000000"',
    )
    expect(
      Hex.fromBytes(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        {
          size: 32,
        },
      ),
    ).toMatchInlineSnapshot(
      '"0x48656c6c6f20576f726c64210000000000000000000000000000000000000000"',
    )
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.from(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        {
          size: 8,
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`8\` bytes. Given size: \`12\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
    expect(() =>
      Hex.fromBytes(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        {
          size: 8,
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`8\` bytes. Given size: \`12\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
  })
})

describe('hex to hex', () => {
  test('default', () => {
    expect(Hex.from('0xdeadbeef')).toMatchInlineSnapshot(`"0xdeadbeef"`)
  })
})

test('error: invalid type', () => {
  // @ts-expect-error
  expect(() => Hex.from(new Date())).toThrowErrorMatchingInlineSnapshot(
    `
    [Hex.InvalidTypeError: Type \`object\` is invalid. Expected: \`string | number | bigint | boolean | Bytes | readonly number[]\`

    See: https://oxlib.sh/errors#hexinvalidtypeerror]
  `,
  )
})
