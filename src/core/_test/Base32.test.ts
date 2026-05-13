import { Base32 } from 'ox'
import { describe, expect, test } from 'vitest'

describe('encode', () => {
  test('default', () => {
    expect(
      Base32.encode(new Uint8Array([0x00, 0xff, 0x00])),
    ).toMatchInlineSnapshot(`"qrlsq"`)
  })

  test('single byte', () => {
    expect(Base32.encode(new Uint8Array([0x00]))).toMatchInlineSnapshot(`"qq"`)
  })

  test('20 bytes (address-like)', () => {
    const bytes = new Uint8Array(20).fill(0xab)
    const encoded = Base32.encode(bytes)
    const decoded = Base32.decode(encoded)
    expect(decoded.slice(0, 20)).toEqual(bytes)
  })
})

describe('encode', () => {
  test('default', () => {
    expect(Base32.encode('0x00ff00')).toMatchInlineSnapshot(`"qrlsq"`)
  })
})

describe('decode', () => {
  test('round-trip', () => {
    const original = new Uint8Array([
      0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8,
      0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0xbd, 0x28,
    ])
    const encoded = Base32.encode(original)
    const decoded = Base32.decode(encoded)
    expect(decoded.slice(0, original.length)).toEqual(original)
  })

  test('error: invalid character', () => {
    expect(() => Base32.decode('b!')).toThrowErrorMatchingInlineSnapshot(
      `[Base32.InvalidCharacterError: Invalid bech32 base32 character: "b".]`,
    )
  })
})

describe('decode', () => {
  test('round-trip', () => {
    const encoded = Base32.encode('0x00ff00')
    expect(Base32.decode(encoded, { as: 'Hex' })).toMatchInlineSnapshot(
      `"0x00ff00"`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(Base32)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "InvalidCharacterError",
      "InvalidPaddingError",
    ]
  `)
})
