import { Base64, Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromBytes', () => {
  test('default', () => {
    expect(Base64.fromBytes(Bytes.fromString('hello wo�d'))).toBe(
      'aGVsbG8gd29/77+9ZA==',
    )
    expect(
      Base64.fromBytes(Bytes.fromString('hello wo�d'), { url: true }),
    ).toBe('aGVsbG8gd29_77-9ZA==')
    expect(
      Base64.fromBytes(Bytes.fromString('hhello wo�d'), { url: true }),
    ).toBe('aGhlbGxvIHdvf--_vWQ=')
    expect(
      Base64.fromBytes(Bytes.fromString('hello wo�d'), { pad: false }),
    ).toBe('aGVsbG8gd29/77+9ZA')
  })
})

describe('fromHex', () => {
  test('default', () => {
    expect(Base64.fromHex(Hex.fromString('hello wo�d'))).toBe(
      'aGVsbG8gd29/77+9ZA==',
    )
    expect(Base64.fromHex(Hex.fromString('hello wo�d'), { url: true })).toBe(
      'aGVsbG8gd29_77-9ZA==',
    )
    expect(Base64.fromHex(Hex.fromString('hello wo�d'), { pad: false })).toBe(
      'aGVsbG8gd29/77+9ZA',
    )
  })
})

describe('fromString', () => {
  test('default', () => {
    expect(Base64.fromString('hello wo�d')).toBe('aGVsbG8gd29/77+9ZA==')
    expect(Base64.fromString('hello wo�d', { url: true })).toBe(
      'aGVsbG8gd29_77-9ZA==',
    )
    expect(Base64.fromString('hello wo�d', { pad: false })).toBe(
      'aGVsbG8gd29/77+9ZA',
    )
  })
})

describe('toBytes', () => {
  test('default', () => {
    // pad
    expect(Base64.toBytes('aGVsbG8gd29/77+9ZA==')).toStrictEqual(
      Bytes.fromString('hello wo�d'),
    )
    // no pad
    expect(Base64.toBytes('aGVsbG8gd29/77+9ZA')).toStrictEqual(
      Bytes.fromString('hello wo�d'),
    )
    // url
    expect(Base64.toBytes('aGVsbG8gd29_77-9ZA==')).toStrictEqual(
      Bytes.fromString('hello wo�d'),
    )
  })
})

describe('toHex', () => {
  test('default', () => {
    // pad
    expect(Base64.toHex('aGVsbG8gd29/77+9ZA==')).toStrictEqual(
      Hex.fromString('hello wo�d'),
    )
    // no pad
    expect(Base64.toHex('aGVsbG8gd29/77+9ZA')).toStrictEqual(
      Hex.fromString('hello wo�d'),
    )
    // url
    expect(Base64.toHex('aGVsbG8gd29_77-9ZA==')).toStrictEqual(
      Hex.fromString('hello wo�d'),
    )
  })
})

describe('toString', () => {
  test('default', () => {
    // pad
    expect(Base64.toString('aGVsbG8gd29/77+9ZA==')).toStrictEqual('hello wo�d')
    // no pad
    expect(Base64.toString('aGVsbG8gd29/77+9ZA')).toStrictEqual('hello wo�d')
    // url
    expect(Base64.toString('aGVsbG8gd29_77-9ZA==')).toStrictEqual('hello wo�d')
  })
})

describe('encode', () => {
  test('bytes input', () => {
    const bytes = new Uint8Array([
      104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
    ])
    expect(Base64.encode(bytes)).toBe('aGVsbG8gd29ybGQ=')
  })

  test('hex input', () => {
    expect(Base64.encode('0x68656c6c6f20776f726c64')).toBe('aGVsbG8gd29ybGQ=')
  })

  test('utf-8 string input', () => {
    expect(Base64.encode('hello world')).toBe('aGVsbG8gd29ybGQ=')
  })

  test('forwards options', () => {
    expect(Base64.encode('hello world', { pad: false })).toBe('aGVsbG8gd29ybGQ')
  })
})

describe('decode', () => {
  test('default (Bytes)', () => {
    expect(Base64.decode('aGVsbG8gd29ybGQ=')).toEqual(
      new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]),
    )
  })

  test('as: Hex', () => {
    expect(Base64.decode('aGVsbG8gd29ybGQ=', { as: 'Hex' })).toBe(
      '0x68656c6c6f20776f726c64',
    )
  })

  test('as: String', () => {
    expect(Base64.decode('aGVsbG8gd29ybGQ=', { as: 'String' })).toBe(
      'hello world',
    )
  })
})

test('exports', () => {
  expect(Object.keys(Base64)).toMatchInlineSnapshot(`
    [
      "fromBytes",
      "fromHex",
      "fromString",
      "encode",
      "toBytes",
      "toHex",
      "toString",
      "decode",
      "InvalidCharacterError",
      "InvalidLengthError",
      "InvalidPaddingError",
    ]
  `)
})
