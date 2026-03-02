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

  test('lowercases HRP', () => {
    const a = Bech32m.encode('TEST', new Uint8Array(1))
    const b = Bech32m.encode('test', new Uint8Array(1))
    expect(a).toBe(b)
    expect(a.startsWith('test1')).toBe(true)
  })

  test('error: empty HRP', () => {
    expect(() => Bech32m.encode('', new Uint8Array(1))).toThrow(
      Bech32m.InvalidHrpError,
    )
  })

  test('error: HRP character out of range (space)', () => {
    expect(() => Bech32m.encode('te st', new Uint8Array(1))).toThrow(
      Bech32m.InvalidHrpError,
    )
  })

  test('error: exceeds length limit', () => {
    expect(() => Bech32m.encode('test', new Uint8Array(100))).toThrow(
      Bech32m.ExceedsLengthError,
    )
  })

  test('custom limit', () => {
    const data = new Uint8Array(100)
    expect(() => Bech32m.encode('test', data, { limit: 200 })).not.toThrow()
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
    expect(() =>
      Bech32m.decode('Tempo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwa7xtm'),
    ).toThrow(Bech32m.MixedCaseError)
  })

  test('error: no separator', () => {
    expect(() => Bech32m.decode('noseparator')).toThrow(
      Bech32m.NoSeparatorError,
    )
  })

  test('error: empty HRP', () => {
    expect(() => Bech32m.decode('1qyrz8wqd2c9m')).toThrow(
      Bech32m.InvalidHrpError,
    )
  })

  test('error: invalid checksum', () => {
    const encoded = Bech32m.encode('tempo', new Uint8Array(20))
    const tampered = encoded.slice(0, -1) + (encoded.endsWith('q') ? 'p' : 'q')
    expect(() => Bech32m.decode(tampered)).toThrow(Bech32m.InvalidChecksumError)
  })

  test('error: invalid character', () => {
    expect(() => Bech32m.decode('tempo1qqqqqqq!qqqqq')).toThrow(
      Bech32m.InvalidCharacterError,
    )
  })

  test('error: exceeds length limit', () => {
    expect(() =>
      Bech32m.decode(
        'an84characterslonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11d6pts4',
      ),
    ).toThrow(Bech32m.ExceedsLengthError)
  })

  test('custom limit', () => {
    const long = Bech32m.encode('test', new Uint8Array(100), { limit: 200 })
    expect(() => Bech32m.decode(long, { limit: 200 })).not.toThrow()
  })

  test('error: too short (no data after separator)', () => {
    expect(() => Bech32m.decode('tempo1qqqqq')).toThrow(
      Bech32m.InvalidChecksumError,
    )
  })
})

// ── BIP-350 test vectors ──────────────────────────────────────────────────────
// https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#test-vectors-for-bech32m

describe('BIP-350 valid bech32m vectors', () => {
  test.each([
    ['A1LQFN3A', 'a', 0],
    ['a1lqfn3a', 'a', 0],
    [
      'an83characterlonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11sg7hg6',
      'an83characterlonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber1',
      0,
    ],
    ['abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx', 'abcdef', 20],
    [
      'split1checkupstagehandshakeupstreamerranterredcaperredlc445v',
      'split',
      30,
    ],
    ['?1v759aa', '?', 0],
  ] as [string, string, number][])(
    '%s',
    (str, expectedHrp, expectedDataLength) => {
      const { hrp, data } = Bech32m.decode(str)
      expect(hrp).toBe(expectedHrp)
      expect(data.length).toBe(expectedDataLength)
      // Re-encode and verify round-trip
      expect(Bech32m.encode(hrp, data)).toBe(str.toLowerCase())
    },
  )

  test('11lll...ludsr8 (valid bech32m but non-zero 5→8 padding rejected by byte-level API)', () => {
    expect(() =>
      Bech32m.decode(
        '11llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllludsr8',
      ),
    ).toThrow(Bech32m.InvalidPaddingError)
  })
})

describe('BIP-350 invalid bech32m vectors', () => {
  test('HRP character out of range (0x20 space)', () => {
    expect(() => Bech32m.decode('\x201xj0phk')).toThrow(Bech32m.InvalidHrpError)
  })

  test('HRP character out of range (0x7F DEL)', () => {
    expect(() => Bech32m.decode('\x7f1g6xzxy')).toThrow(Bech32m.InvalidHrpError)
  })

  test('HRP character out of range (0x80)', () => {
    expect(() => Bech32m.decode('\x801vctc34')).toThrow(Bech32m.InvalidHrpError)
  })

  test('overall max length exceeded', () => {
    expect(() =>
      Bech32m.decode(
        'an84characterslonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11d6pts4',
      ),
    ).toThrow(Bech32m.ExceedsLengthError)
  })

  test('no separator character', () => {
    expect(() => Bech32m.decode('qyrz8wqd2c9m')).toThrow(
      Bech32m.NoSeparatorError,
    )
  })

  test('empty HRP', () => {
    expect(() => Bech32m.decode('1qyrz8wqd2c9m')).toThrow(
      Bech32m.InvalidHrpError,
    )
  })

  test('invalid data character (b)', () => {
    expect(() => Bech32m.decode('y1b0jsk6g')).toThrow(
      Bech32m.InvalidCharacterError,
    )
  })

  test('invalid data character (i)', () => {
    expect(() => Bech32m.decode('lt1igcx5c0')).toThrow(
      Bech32m.InvalidCharacterError,
    )
  })

  test('too short checksum', () => {
    expect(() => Bech32m.decode('in1muywd')).toThrow(
      Bech32m.InvalidChecksumError,
    )
  })

  test('invalid character in checksum (i)', () => {
    expect(() => Bech32m.decode('mm1crxm3i')).toThrow(
      Bech32m.InvalidCharacterError,
    )
  })

  test('invalid character in checksum (o)', () => {
    expect(() => Bech32m.decode('au1s5cgom')).toThrow(
      Bech32m.InvalidCharacterError,
    )
  })

  test('checksum calculated with uppercase form of HRP', () => {
    expect(() => Bech32m.decode('M1VUXWEZ')).toThrow(
      Bech32m.InvalidChecksumError,
    )
  })

  test('empty HRP (16plkw9)', () => {
    expect(() => Bech32m.decode('16plkw9')).toThrow(Bech32m.InvalidHrpError)
  })

  test('empty HRP (1p2gdwpf)', () => {
    expect(() => Bech32m.decode('1p2gdwpf')).toThrow(Bech32m.InvalidHrpError)
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
      "MixedCaseError",
      "InvalidHrpError",
      "ExceedsLengthError",
    ]
  `)
})
