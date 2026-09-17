import { Base32 } from 'ox'
import { describe, expect, test } from 'vp/test'

describe('fromBytes', () => {
  test('default', () => {
    expect(
      Base32.fromBytes(new Uint8Array([0x00, 0xff, 0x00])),
    ).toMatchInlineSnapshot(`"qrlsq"`)
  })

  test('single byte', () => {
    expect(Base32.fromBytes(new Uint8Array([0x00]))).toMatchInlineSnapshot(
      `"qq"`,
    )
  })

  test('20 bytes (address-like)', () => {
    const bytes = new Uint8Array(20).fill(0xab)
    const encoded = Base32.fromBytes(bytes)
    const decoded = Base32.toBytes(encoded)
    expect(decoded.slice(0, 20)).toEqual(bytes)
  })
})

describe('fromHex', () => {
  test('default', () => {
    expect(Base32.fromHex('0x00ff00')).toMatchInlineSnapshot(`"qrlsq"`)
  })
})

describe('toBytes', () => {
  test('round-trip', () => {
    const original = new Uint8Array([
      0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8,
      0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0xbd, 0x28,
    ])
    const encoded = Base32.fromBytes(original)
    const decoded = Base32.toBytes(encoded)
    expect(decoded.slice(0, original.length)).toEqual(original)
  })

  test('error: invalid character', () => {
    expect(() => Base32.toBytes('b!')).toThrowErrorMatchingInlineSnapshot(
      `[Base32.InvalidCharacterError: Invalid bech32 base32 character: "b".]`,
    )
  })

  test('error: non-zero trailing bits', () => {
    // `qrlsq` is the canonical encoding of [0x00, 0xff, 0x00]; flipping the
    // final symbol only touches bits below the byte boundary. A canonical
    // decoder must reject this rather than silently decode to the same
    // bytes as `qrlsq` -- two distinct strings must not collide to one value.
    const canonical = Base32.fromBytes(new Uint8Array([0x00, 0xff, 0x00]))
    expect(canonical).toEqual('qrlsq')
    expect(() => Base32.toBytes('qrlsp')).toThrowErrorMatchingInlineSnapshot(
      `[Base32.InvalidPaddingError: Non-canonical trailing bits in Base32 input.]`,
    )
  })

  test('accepts canonical zero-padded trailing bits', () => {
    expect(Base32.toBytes('qq')).toEqual(new Uint8Array([0x00]))
    for (let n = 1; n <= 8; n++) {
      const bytes = new Uint8Array(n).map((_, i) => (i * 37 + 11) & 0xff)
      const encoded = Base32.fromBytes(bytes)
      expect(Base32.toBytes(encoded)).toEqual(bytes)
    }
  })
})

describe('toHex', () => {
  test('round-trip', () => {
    const encoded = Base32.fromHex('0x00ff00')
    expect(Base32.toHex(encoded)).toMatchInlineSnapshot(`"0x00ff00"`)
  })
})

test('exports', () => {
  expect(Object.keys(Base32)).toMatchInlineSnapshot(`
    [
      "fromBytes",
      "fromHex",
      "toBytes",
      "toHex",
      "InvalidCharacterError",
      "InvalidPaddingError",
    ]
  `)
})
