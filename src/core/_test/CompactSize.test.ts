import { CompactSize } from 'ox'
import { describe, expect, test } from 'vitest'

describe('decode', () => {
  test('single byte (0-252)', () => {
    expect(CompactSize.encode(0n)).toMatchInlineSnapshot(`
      Uint8Array [
        0,
      ]
    `)
    expect(CompactSize.encode(1n)).toMatchInlineSnapshot(`
      Uint8Array [
        1,
      ]
    `)
    expect(CompactSize.encode(252n)).toMatchInlineSnapshot(`
      Uint8Array [
        252,
      ]
    `)
  })

  test('3 bytes (253-65535)', () => {
    expect(CompactSize.encode(253n)).toMatchInlineSnapshot(`
      Uint8Array [
        253,
        253,
        0,
      ]
    `)
    expect(CompactSize.encode(65535n)).toMatchInlineSnapshot(`
      Uint8Array [
        253,
        255,
        255,
      ]
    `)
  })

  test('5 bytes (65536-4294967295)', () => {
    expect(CompactSize.encode(65536n)).toMatchInlineSnapshot(`
      Uint8Array [
        254,
        0,
        0,
        1,
        0,
      ]
    `)
    expect(CompactSize.encode(4294967295n)).toMatchInlineSnapshot(`
      Uint8Array [
        254,
        255,
        255,
        255,
        255,
      ]
    `)
  })

  test('9 bytes (> 4294967295)', () => {
    expect(CompactSize.encode(4294967296n)).toMatchInlineSnapshot(`
      Uint8Array [
        255,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
      ]
    `)
  })

  test('error: negative value', () => {
    expect(() => CompactSize.encode(-1n)).toThrowErrorMatchingInlineSnapshot(
      `[CompactSize.NegativeValueError: CompactSize value must be non-negative, got -1.]`,
    )
  })
})

describe('decode', () => {
  test('default', () => {
    expect(CompactSize.encode(252n, { as: 'Hex' })).toMatchInlineSnapshot(
      `"0xfc"`,
    )
    expect(CompactSize.encode(253n, { as: 'Hex' })).toMatchInlineSnapshot(
      `"0xfdfd00"`,
    )
  })
})

describe('encode', () => {
  test('round-trip (single byte)', () => {
    for (const n of [0n, 1n, 100n, 252n]) {
      const encoded = CompactSize.encode(n)
      const { value, size } = CompactSize.decode(encoded)
      expect(value).toBe(n)
      expect(size).toBe(1)
    }
  })

  test('round-trip (3 bytes)', () => {
    for (const n of [253n, 1000n, 65535n]) {
      const encoded = CompactSize.encode(n)
      const { value, size } = CompactSize.decode(encoded)
      expect(value).toBe(n)
      expect(size).toBe(3)
    }
  })

  test('round-trip (5 bytes)', () => {
    for (const n of [65536n, 1000000n, 4294967295n]) {
      const encoded = CompactSize.encode(n)
      const { value, size } = CompactSize.decode(encoded)
      expect(value).toBe(n)
      expect(size).toBe(5)
    }
  })

  test('round-trip (9 bytes)', () => {
    const n = BigInt('18446744073709551615')
    const encoded = CompactSize.encode(n)
    const { value, size } = CompactSize.decode(encoded)
    expect(value).toBe(n)
    expect(size).toBe(9)
  })

  test('large value returns bigint', () => {
    const n = BigInt('4294967296')
    const encoded = CompactSize.encode(n)
    const { value } = CompactSize.decode(encoded)
    expect(typeof value).toBe('bigint')
    expect(value).toBe(4294967296n)
  })

  test('error: empty bytes', () => {
    expect(() =>
      CompactSize.decode(new Uint8Array()),
    ).toThrowErrorMatchingInlineSnapshot(
      `[CompactSize.InsufficientBytesError: Insufficient bytes for CompactSize decoding. Expected at least 1, got 0.]`,
    )
  })

  test('error: insufficient bytes (3-byte encoding)', () => {
    expect(() =>
      CompactSize.decode(new Uint8Array([0xfd, 0x00])),
    ).toThrowErrorMatchingInlineSnapshot(
      `[CompactSize.InsufficientBytesError: Insufficient bytes for CompactSize decoding. Expected at least 3, got 2.]`,
    )
  })
})

describe('encode', () => {
  test('default', () => {
    expect(CompactSize.decode('0xfc')).toMatchInlineSnapshot(`
      {
        "size": 1,
        "value": 252n,
      }
    `)
  })
})

test('exports', () => {
  expect(Object.keys(CompactSize)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "NegativeValueError",
      "InsufficientBytesError",
      "InvalidValueError",
      "NonMinimalEncodingError",
    ]
  `)
})
