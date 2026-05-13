import { Base64, Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vitest'

describe('encode', () => {
  test('default', () => {
    expect(Base64.encode(Bytes.fromString('hello wo�d'))).toBe(
      'aGVsbG8gd29/77+9ZA==',
    )
    expect(Base64.encode(Bytes.fromString('hello wo�d'), { url: true })).toBe(
      'aGVsbG8gd29_77-9ZA==',
    )
    expect(Base64.encode(Bytes.fromString('hhello wo�d'), { url: true })).toBe(
      'aGhlbGxvIHdvf--_vWQ=',
    )
    expect(Base64.encode(Bytes.fromString('hello wo�d'), { pad: false })).toBe(
      'aGVsbG8gd29/77+9ZA',
    )
  })
})

describe('encode', () => {
  test('default', () => {
    expect(Base64.encode(Hex.fromString('hello wo�d'))).toBe(
      'aGVsbG8gd29/77+9ZA==',
    )
    expect(Base64.encode(Hex.fromString('hello wo�d'), { url: true })).toBe(
      'aGVsbG8gd29_77-9ZA==',
    )
    expect(Base64.encode(Hex.fromString('hello wo�d'), { pad: false })).toBe(
      'aGVsbG8gd29/77+9ZA',
    )
  })
})

describe('encode', () => {
  test('default', () => {
    expect(Base64.encode('hello wo�d')).toBe('aGVsbG8gd29/77+9ZA==')
    expect(Base64.encode('hello wo�d', { url: true })).toBe(
      'aGVsbG8gd29_77-9ZA==',
    )
    expect(Base64.encode('hello wo�d', { pad: false })).toBe(
      'aGVsbG8gd29/77+9ZA',
    )
  })
})

describe('decode', () => {
  test('default', () => {
    // pad
    expect(Base64.decode('aGVsbG8gd29/77+9ZA==')).toStrictEqual(
      Bytes.fromString('hello wo�d'),
    )
    // no pad
    expect(Base64.decode('aGVsbG8gd29/77+9ZA')).toStrictEqual(
      Bytes.fromString('hello wo�d'),
    )
    // url
    expect(Base64.decode('aGVsbG8gd29_77-9ZA==')).toStrictEqual(
      Bytes.fromString('hello wo�d'),
    )
  })
})

describe('decode', () => {
  test('default', () => {
    // pad
    expect(Base64.decode('aGVsbG8gd29/77+9ZA==', { as: 'Hex' })).toStrictEqual(
      Hex.fromString('hello wo�d'),
    )
    // no pad
    expect(Base64.decode('aGVsbG8gd29/77+9ZA', { as: 'Hex' })).toStrictEqual(
      Hex.fromString('hello wo�d'),
    )
    // url
    expect(Base64.decode('aGVsbG8gd29_77-9ZA==', { as: 'Hex' })).toStrictEqual(
      Hex.fromString('hello wo�d'),
    )
  })
})

describe('decode', () => {
  test('default', () => {
    // pad
    expect(
      Base64.decode('aGVsbG8gd29/77+9ZA==', { as: 'String' }),
    ).toStrictEqual('hello wo�d')
    // no pad
    expect(Base64.decode('aGVsbG8gd29/77+9ZA', { as: 'String' })).toStrictEqual(
      'hello wo�d',
    )
    // url
    expect(
      Base64.decode('aGVsbG8gd29_77-9ZA==', { as: 'String' }),
    ).toStrictEqual('hello wo�d')
  })
})

test('exports', () => {
  expect(Object.keys(Base64)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "InvalidCharacterError",
      "InvalidLengthError",
      "InvalidPaddingError",
    ]
  `)
})
