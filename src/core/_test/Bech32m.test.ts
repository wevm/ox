import { Bech32m } from 'ox'
import { describe, expect, test } from 'vitest'

describe('encode', () => {
  test('20 zero bytes', () => {
    expect(
      Bech32m.encode('tempo', new Uint8Array(20)),
    ).toMatchInlineSnapshot(
      `"tempo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwa7xtm"`,
    )
  })

  test('round-trip', () => {
    const data = new Uint8Array([
      0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3,
      0xb8, 0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0xbd, 0x28,
    ])
    const encoded = Bech32m.encode('tempo', data)
    const decoded = Bech32m.decode(encoded)
    expect(decoded.hrp).toBe('tempo')
    expect(decoded.data).toEqual(data)
  })

  test('different HRP', () => {
    const data = new Uint8Array([0x01, 0x02])
    const encoded = Bech32m.encode('test', data)
    expect(encoded.startsWith('test1')).toBe(true)
    const decoded = Bech32m.decode(encoded)
    expect(decoded.hrp).toBe('test')
    expect(decoded.data).toEqual(data)
  })
})

describe('decode', () => {
  test('valid bech32m string', () => {
    const encoded = Bech32m.encode('tempo', new Uint8Array(20))
    const { hrp, data } = Bech32m.decode(encoded)
    expect(hrp).toBe('tempo')
    expect(data).toEqual(new Uint8Array(20))
  })

  test('case insensitive', () => {
    const encoded = Bech32m.encode('tempo', new Uint8Array(20))
    const upper = encoded.toUpperCase()
    const { hrp, data } = Bech32m.decode(upper)
    expect(hrp).toBe('tempo')
    expect(data).toEqual(new Uint8Array(20))
  })

  test('error: no separator', () => {
    expect(() =>
      Bech32m.decode('noseparator'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Bech32m.NoSeparatorError: Bech32m string has no separator.]`,
    )
  })

  test('error: invalid checksum', () => {
    const encoded = Bech32m.encode('tempo', new Uint8Array(20))
    const tampered = encoded.slice(0, -1) + (encoded.endsWith('q') ? 'p' : 'q')
    expect(() =>
      Bech32m.decode(tampered),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Bech32m.InvalidChecksumError: Invalid bech32m checksum.]`,
    )
  })

  test('error: invalid character', () => {
    expect(() =>
      Bech32m.decode('tempo1qqqqqqq!qqqqq'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Bech32m.InvalidCharacterError: Invalid bech32m character: "!".]`,
    )
  })

  test('error: too short (no data after separator)', () => {
    expect(() =>
      Bech32m.decode('tempo1qqqqq'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Bech32m.InvalidChecksumError: Invalid bech32m checksum.]`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(Bech32m)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "NoSeparatorError",
      "InvalidChecksumError",
      "InvalidCharacterError",
      "InvalidPaddingError",
    ]
  `)
})
