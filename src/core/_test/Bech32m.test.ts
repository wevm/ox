import { Bech32m } from 'ox'
import { describe, expect, test } from 'vitest'

describe('encode', () => {
  test('20 zero bytes', () => {
    expect(Bech32m.encode('tempo', new Uint8Array(20))).toMatchInlineSnapshot(
      `"tempo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwa7xtm"`,
    )
  })

  test('round-trip', () => {
    const data = new Uint8Array([
      0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8,
      0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0xbd, 0x28,
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

  test('all uppercase', () => {
    const encoded = Bech32m.encode('tempo', new Uint8Array(20))
    const upper = encoded.toUpperCase()
    const { hrp, data } = Bech32m.decode(upper)
    expect(hrp).toBe('tempo')
    expect(data).toEqual(new Uint8Array(20))
  })

  test('error: mixed case', () => {
    const encoded = Bech32m.encode('tempo', new Uint8Array(20))
    const mixed = encoded[0]!.toUpperCase() + encoded.slice(1)
    expect(() => Bech32m.decode(mixed)).toThrowErrorMatchingInlineSnapshot(
      `[Bech32m.MixedCaseError: Bech32m string must not be mixed case.]`,
    )
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
    expect(() => Bech32m.decode(tampered)).toThrowErrorMatchingInlineSnapshot(
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

// BIP-350 official test vectors
// https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#test-vectors-for-bech32m
describe('BIP-350 test vectors', () => {
  // Valid bech32m strings that also round-trip as byte payloads.
  const validBech32m = [
    'A1LQFN3A',
    'a1lqfn3a',
    'an83characterlonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11sg7hg6',
    'abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx',
    'split1checkupstagehandshakeupstreamerranterredcaperredlc445v',
    '?1v759aa',
  ]

  test.each(validBech32m)('valid: %s', (str) => {
    const { hrp, data } = Bech32m.decode(str, { limit: 100 })
    const reencoded = Bech32m.encode(hrp, data, { limit: 100 })
    expect(reencoded).toBe(str.toLowerCase())
  })

  // This valid bech32m string has non-zero 5→8 bit padding (all data words are
  // 31 = 0b11111), so our byte-level API correctly rejects it during
  // convertBits. The checksum itself is valid per BIP-350.
  test('valid checksum but non-zero padding: 11lll...ludsr8', () => {
    expect(() =>
      Bech32m.decode(
        '11llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllludsr8',
        { limit: 100 },
      ),
    ).toThrow(Bech32m.InvalidPaddingError)
  })

  const invalidBech32m: [string, string][] = [
    ['\x201xj0phk', 'HRP character out of range'],
    ['\x7f1g6xzxy', 'HRP character out of range'],
    ['\x801vctc34', 'HRP character out of range'],
    [
      'an84characterslonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11d6pts4',
      'overall max length exceeded',
    ],
    ['qyrz8wqd2c9m', 'No separator character'],
    ['1qyrz8wqd2c9m', 'Empty HRP'],
    ['y1b0jsk6g', 'Invalid data character'],
    ['lt1igcx5c0', 'Invalid data character'],
    ['in1muywd', 'Too short checksum'],
    ['mm1crxm3i', 'Invalid character in checksum'],
    ['au1s5cgom', 'Invalid character in checksum'],
    ['M1VUXWEZ', 'checksum calculated with uppercase form of HRP'],
    ['16plkw9', 'empty HRP'],
    ['1p2gdwpf', 'empty HRP'],
  ]

  test.each(invalidBech32m)('invalid: %s (%s)', (str) => {
    expect(() => Bech32m.decode(str)).toThrow()
  })
})

test('exports', () => {
  expect(Object.keys(Bech32m)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "ExceedsLengthError",
      "InvalidHrpError",
      "MixedCaseError",
      "NoSeparatorError",
      "InvalidChecksumError",
      "InvalidCharacterError",
      "InvalidPaddingError",
    ]
  `)
})
