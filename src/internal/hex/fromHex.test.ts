import { Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vitest'

describe('hex to number', () => {
  test('default', () => {
    expect(Hex.to('0x0', 'number')).toMatchInlineSnapshot('0')
    expect(Hex.to('0x7', 'number')).toMatchInlineSnapshot('7')
    expect(Hex.to('0x45', 'number')).toMatchInlineSnapshot('69')
    expect(Hex.to('0x1a4', 'number')).toMatchInlineSnapshot('420')

    expect(Hex.toNumber('0x0')).toMatchInlineSnapshot('0')
    expect(Hex.toNumber('0x7')).toMatchInlineSnapshot('7')
    expect(Hex.toNumber('0x45')).toMatchInlineSnapshot('69')
    expect(Hex.toNumber('0x1a4')).toMatchInlineSnapshot('420')
  })

  test('args: signed', () => {
    expect(Hex.toNumber('0x20', { signed: true })).toBe(32)
    expect(
      Hex.toNumber('0xe0', {
        signed: true,
      }),
    ).toBe(-32)
    expect(
      Hex.toNumber('0xffffffe0', {
        signed: true,
      }),
    ).toBe(-32)

    expect(Hex.toNumber('0x007f', { signed: true })).toBe(127)
    expect(Hex.toNumber('0xff81', { signed: true })).toBe(-127)
    expect(Hex.toNumber('0x7fff', { signed: true })).toBe(32767)
    expect(Hex.toNumber('0x8000', { signed: true })).toBe(-32768)

    expect(Hex.toNumber('0xffff', { signed: true })).toBe(-1)
    expect(Hex.toNumber('0x4961769b', { signed: true })).toBe(1231124123)
    expect(Hex.toNumber('0x00027760a62ec2ac', { signed: true })).toBe(
      694206942069420,
    )
  })

  test('args: size', () => {
    expect(
      Hex.to(Hex.from(69420, { size: 32 }), 'number', {
        size: 32,
      }),
    ).toEqual(69420)
    expect(
      Hex.toNumber(Hex.from(69420, { size: 32 }), {
        size: 32,
      }),
    ).toEqual(69420)
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.toNumber(Hex.from(69420, { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `)
  })
})

describe('hex to bigint', () => {
  test('default', () => {
    expect(Hex.to('0x0', 'bigint')).toMatchInlineSnapshot('0n')
    expect(Hex.to('0x7', 'bigint')).toMatchInlineSnapshot('7n')
    expect(Hex.to('0x45', 'bigint')).toMatchInlineSnapshot('69n')
    expect(Hex.to('0x1a4', 'bigint')).toMatchInlineSnapshot('420n')
    expect(
      Hex.to('0xc5cf39211876fb5e5884327fa56fc0b75', 'bigint'),
    ).toMatchInlineSnapshot('4206942069420694206942069420694206942069n')

    expect(Hex.toBigInt('0x0')).toMatchInlineSnapshot('0n')
    expect(Hex.toBigInt('0x7')).toMatchInlineSnapshot('7n')
    expect(Hex.toBigInt('0x45')).toMatchInlineSnapshot('69n')
    expect(Hex.toBigInt('0x1a4')).toMatchInlineSnapshot('420n')
    expect(
      Hex.toBigInt('0xc5cf39211876fb5e5884327fa56fc0b75'),
    ).toMatchInlineSnapshot('4206942069420694206942069420694206942069n')
  })

  test('args: signed', () => {
    expect(Hex.toBigInt('0x20', { signed: true })).toBe(32n)
    expect(
      Hex.toBigInt('0xe0', {
        signed: true,
      }),
    ).toBe(-32n)

    expect(Hex.toBigInt('0x007f', { signed: true })).toBe(127n)
    expect(Hex.toBigInt('0xff81', { signed: true })).toBe(-127n)
    expect(Hex.toBigInt('0x7fff', { signed: true })).toBe(32767n)
    expect(Hex.toBigInt('0x8000', { signed: true })).toBe(-32768n)

    expect(
      Hex.toBigInt(
        '0x000000000000000000000000000000000000000000000000aade1ed08b0b325c',
        {
          signed: true,
        },
      ),
    ).toBe(12312312312312312412n)
    expect(
      Hex.toBigInt(
        '0xffffffffffffffffffffffffffffffffffffffffffffffff5521e12f74f4cda4',
        {
          signed: true,
        },
      ),
    ).toBe(-12312312312312312412n)
  })

  test('args: size', () => {
    expect(
      Hex.to(Hex.from(69420n, { size: 32 }), 'bigint', {
        size: 32,
      }),
    ).toEqual(69420n)
    expect(
      Hex.toBigInt(Hex.from(69420n, { size: 32 }), {
        size: 32,
      }),
    ).toEqual(69420n)
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.toBigInt(Hex.from(69420, { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `)
  })
})

describe('hex to boolean', () => {
  test('default', () => {
    expect(Hex.to('0x0', 'boolean')).toMatchInlineSnapshot('false')
    expect(Hex.to('0x1', 'boolean')).toMatchInlineSnapshot('true')

    expect(Hex.toBoolean('0x0')).toMatchInlineSnapshot('false')
    expect(Hex.toBoolean('0x1')).toMatchInlineSnapshot('true')
  })

  test('args: size', () => {
    expect(
      Hex.to(Hex.from(true, { size: 32 }), 'boolean', {
        size: 32,
      }),
    ).toEqual(true)
    expect(Hex.toBoolean(Hex.from(true, { size: 32 }), { size: 32 })).toEqual(
      true,
    )
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.toBoolean(Hex.from(true, { size: 64 }), { size: 32 }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `)
  })

  test('error: invalid boolean', () => {
    expect(() => Hex.toBoolean('0xa')).toThrowErrorMatchingInlineSnapshot(
      `
      [InvalidHexBooleanError: Hex value \`"0xa"\` is not a valid boolean. The hex value must be \`"0x0"\` (false) or \`"0x1"\` (true).

      See: https://oxlib.sh/errors#invalidhexbooleanerror]
    `,
    )
  })
})

describe('hex to string', () => {
  test('default', () => {
    expect(Hex.to('0x', 'string')).toMatchInlineSnapshot(`""`)
    expect(Hex.to('0x61', 'string')).toMatchInlineSnapshot(`"a"`)
    expect(Hex.to('0x616263', 'string')).toMatchInlineSnapshot(`"abc"`)
    expect(
      Hex.to('0x48656c6c6f20576f726c6421', 'string'),
    ).toMatchInlineSnapshot(`"Hello World!"`)

    expect(Hex.toString('0x')).toMatchInlineSnapshot(`""`)
    expect(Hex.toString('0x61')).toMatchInlineSnapshot(`"a"`)
    expect(Hex.toString('0x616263')).toMatchInlineSnapshot(`"abc"`)
    expect(Hex.toString('0x48656c6c6f20576f726c6421')).toMatchInlineSnapshot(
      `"Hello World!"`,
    )
  })

  test('args: size', () => {
    expect(
      Hex.to(Hex.from('wagmi', { size: 32 }), 'string', {
        size: 32,
      }),
    ).toEqual('wagmi')
    expect(
      Hex.toString(Hex.from('wagmi', { size: 32 }), {
        size: 32,
      }),
    ).toEqual('wagmi')
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.toString(Hex.from('wagmi', { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `)
  })
})

describe('hex to bytes', () => {
  test('default', () => {
    expect(Hex.to('0x', 'bytes')).toMatchInlineSnapshot('Uint8Array []')
    expect(Hex.to('0x61', 'bytes')).toMatchInlineSnapshot(`
      Uint8Array [
        97,
      ]
    `)
    expect(Hex.to('0x616263', 'bytes')).toMatchInlineSnapshot(
      `
      Uint8Array [
        97,
        98,
        99,
      ]
    `,
    )
    expect(
      Hex.to('0x48656c6c6f20576f726c6421', 'bytes'),
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
      ]
    `)
  })

  test('args: size', () => {
    expect(
      Hex.to(Hex.from(Bytes.from([69, 420]), { size: 32 }), 'bytes', {
        size: 32,
      }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        69,
        164,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
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
    `)
    expect(
      Hex.toBytes(Hex.from(Bytes.from([69, 420]), { size: 32 }), {
        size: 32,
      }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        69,
        164,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
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
    `)
  })

  test('error: size overflow', () => {
    expect(() =>
      Hex.toString(Hex.from(Bytes.from([69, 420]), { size: 64 }), {
        size: 32,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#sizeoverflowerror]
    `)
  })

  test('error: invalid bytes', () => {
    expect(() =>
      Hex.to('0x420fggf11a', 'bytes'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Invalid byte sequence ("gg" in "420fggf11a").]`,
    )
  })
})

test('error: invalid `to`', () => {
  // @ts-expect-error
  expect(() => Hex.to(420, 'fake')).toThrowErrorMatchingInlineSnapshot(`
    [InvalidTypeError: Type \`fake\` is invalid. Expected: \`string | bytes | bigint | number | boolean\`

    See: https://oxlib.sh/errors#invalidtypeerror]
  `)
})
