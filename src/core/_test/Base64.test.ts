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

  test('strips invalid characters', () => {
    expect(Base64.toBytes('aGVsbG8!')).toStrictEqual(Bytes.fromString('hello'))
    expect(Base64.toBytes('  aGVsbG8  ')).toStrictEqual(
      Bytes.fromString('hello'),
    )
    expect(Base64.toBytes('aGVs\nbG8=')).toStrictEqual(
      Bytes.fromString('hello'),
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

test('exports', () => {
  expect(Object.keys(Base64)).toMatchInlineSnapshot(`
    [
      "fromBytes",
      "fromHex",
      "fromString",
      "toBytes",
      "toHex",
      "toString",
    ]
  `)
})
