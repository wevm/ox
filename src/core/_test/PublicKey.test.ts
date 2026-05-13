import { Bytes, PublicKey } from 'ox'
import { describe, expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(PublicKey)).toMatchInlineSnapshot(`
    [
      "assert",
      "compress",
      "from",
      "fromBytes",
      "fromHex",
      "toBytes",
      "toParts",
      "fromParts",
      "toHex",
      "validate",
      "InvalidError",
      "InvalidPrefixError",
      "InvalidCompressedPrefixError",
      "InvalidUncompressedPrefixError",
      "InvalidSerializedSizeError",
    ]
  `)
})

describe('PublicKey.assert', () => {
  test('compressed', () => {
    PublicKey.assert({
      prefix: 2,
      x: '0x0000000000000000000000000000000000000000000000000000000000000001',
    })
    PublicKey.assert({
      prefix: 3,
      x: '0x0000000000000000000000000000000000000000000000000000000000000001',
    })

    expect(() =>
      PublicKey.assert({
        x: '0x0000000000000000000000000000000000000000000000000000000000000001',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `,
    )
    expect(() =>
      PublicKey.assert({
        prefix: 5,
        x: '0x0000000000000000000000000000000000000000000000000000000000000001',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `)
  })

  test('uncompressed', () => {
    PublicKey.assert({
      prefix: 4,
      x: '0x0000000000000000000000000000000000000000000000000000000000000001',
      y: '0x0000000000000000000000000000000000000000000000000000000000000001',
    })

    expect(() =>
      PublicKey.assert({
        x: '0x0000000000000000000000000000000000000000000000000000000000000001',
        y: '0x0000000000000000000000000000000000000000000000000000000000000001',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
    expect(() =>
      PublicKey.assert({
        prefix: 3,
        x: '0x0000000000000000000000000000000000000000000000000000000000000001',
        y: '0x0000000000000000000000000000000000000000000000000000000000000001',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "3" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
    expect(() =>
      PublicKey.assert({
        prefix: 5,
        x: '0x0000000000000000000000000000000000000000000000000000000000000001',
        y: '0x0000000000000000000000000000000000000000000000000000000000000001',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
  })

  test('unknown', () => {
    expect(() =>
      PublicKey.assert({
        y: '0x0000000000000000000000000000000000000000000000000000000000000001',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [PublicKey.InvalidError: Value \`{"y":"0x0000000000000000000000000000000000000000000000000000000000000001"}\` is not a valid public key.

      Public key must contain:
      - an \`x\` and \`prefix\` value (compressed)
      - an \`x\`, \`y\`, and \`prefix\` value (uncompressed)]
    `,
    )
  })

  test('behavior: rejects missing x/y when compressed: false is set', () => {
    expect(() =>
      PublicKey.assert({ prefix: 4 }, { compressed: false }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [PublicKey.InvalidError: Value \`{"prefix":4}\` is not a valid public key.

      Public key must contain:
      - an \`x\` and \`prefix\` value (compressed)
      - an \`x\`, \`y\`, and \`prefix\` value (uncompressed)]
    `)
    expect(() =>
      PublicKey.assert(
        {
          prefix: 4,
          x: '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
        { compressed: false },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [PublicKey.InvalidError: Value \`{"prefix":4,"x":"0x0000000000000000000000000000000000000000000000000000000000000001"}\` is not a valid public key.

      Public key must contain:
      - an \`x\` and \`prefix\` value (compressed)
      - an \`x\`, \`y\`, and \`prefix\` value (uncompressed)]
    `)
  })

  test('behavior: rejects missing x or extra y when compressed: true is set', () => {
    expect(() =>
      PublicKey.assert({ prefix: 2 }, { compressed: true }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [PublicKey.InvalidError: Value \`{"prefix":2}\` is not a valid public key.

      Public key must contain:
      - an \`x\` and \`prefix\` value (compressed)
      - an \`x\`, \`y\`, and \`prefix\` value (uncompressed)]
    `)
    expect(() =>
      PublicKey.assert(
        {
          prefix: 2,
          x: '0x0000000000000000000000000000000000000000000000000000000000000001',
          y: '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
        { compressed: true },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [PublicKey.InvalidError: Value \`{"prefix":2,"x":"0x0000000000000000000000000000000000000000000000000000000000000001","y":"0x0000000000000000000000000000000000000000000000000000000000000001"}\` is not a valid public key.

      Public key must contain:
      - an \`x\` and \`prefix\` value (compressed)
      - an \`x\`, \`y\`, and \`prefix\` value (uncompressed)]
    `)
  })
})

describe('PublicKey.compress', () => {
  test('default', () => {
    {
      const publicKey = PublicKey.compress({
        prefix: 4,
        x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
        y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
      })
      expect(publicKey).toMatchInlineSnapshot(`
        {
          "prefix": 3,
          "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        }
      `)
    }

    {
      const publicKey = PublicKey.compress({
        prefix: 4,
        x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
        y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa6',
      })
      expect(publicKey).toMatchInlineSnapshot(`
        {
          "prefix": 2,
          "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        }
      `)
    }
  })
})

describe('PublicKey.fromHex', () => {
  test('default', () => {
    const serialized =
      '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5'
    const publicKey = PublicKey.fromHex(serialized)
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('behavior: prefix', () => {
    const serialized =
      '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5'
    const publicKey = PublicKey.fromHex(serialized)
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('behavior: compressed', () => {
    const serialized =
      '0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75'
    const publicKey = PublicKey.fromHex(serialized)
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 3,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
      }
    `)
  })

  test('error: invalid size', () => {
    expect(() =>
      PublicKey.fromHex(
        '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2a',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidSerializedSizeError: Value \`0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2a\` is an invalid public key size.

    Expected: 33 bytes (compressed + prefix), 64 bytes (uncompressed) or 65 bytes (uncompressed + prefix).
    Received 63 bytes.]
  `)
  })

  test('error: invalid uncompressed prefix', () => {
    // 65-byte serialized with prefix 5 (invalid for uncompressed).
    expect(() =>
      PublicKey.fromHex(
        '0x058318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

      Details: Prefix must be 4 for uncompressed public keys.]
    `)
  })

  test('error: invalid compressed prefix', () => {
    // 33-byte serialized with prefix 5 (invalid for compressed).
    expect(() =>
      PublicKey.fromHex(
        '0x058318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

      Details: Prefix must be 2 or 3 for compressed public keys.]
    `)
  })
})

describe('PublicKey.fromBytes', () => {
  test('default', () => {
    const serialized = Bytes.fromHex(
      '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    )
    const publicKey = PublicKey.fromBytes(serialized)
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('error: invalid prefix', () => {
    const serialized = Bytes.fromHex(
      '0x058318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    )
    expect(() =>
      PublicKey.fromBytes(serialized),
    ).toThrowErrorMatchingInlineSnapshot(`
      [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

      Details: Prefix must be 4 for uncompressed public keys.]
    `)
  })
})

describe('PublicKey.from', () => {
  test('uncompressed', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('uncompressed, serialized hex', () => {
    const publicKey = PublicKey.from(
      '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    )
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('uncompressed, serialized bytes', () => {
    const publicKey = PublicKey.from(
      Bytes.fromHex(
        '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
      ),
    )
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('uncompressed, no prefix', () => {
    const publicKey = PublicKey.from({
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('uncompressed, no prefix, serialized hex', () => {
    const publicKey = PublicKey.from(
      '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    )
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
        "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      }
    `)
  })

  test('compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 3,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
      }
    `)
  })

  test('compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 2,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 2,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
      }
    `)
  })

  test('compressed, serialized hex', () => {
    const publicKey = PublicKey.from(
      '0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    )
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 3,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
      }
    `)
  })

  test('compressed, serialized bytes', () => {
    const publicKey = PublicKey.from(
      Bytes.fromHex(
        '0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      ),
    )
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 3,
        "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
      }
    `)
  })
})

describe('PublicKey.toHex', () => {
  test('default', () => {
    const publicKey = PublicKey.from({
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
    )
  })

  test('behavior: prefix', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
    )
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75"`,
    )
  })

  test('option: includePrefix', () => {
    const publicKey = PublicKey.from({
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    const serialized = PublicKey.toHex(publicKey, { includePrefix: false })
    expect(serialized).toMatchInlineSnapshot(
      `"0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
    )
  })
})

describe('PublicKey.toBytes', () => {
  test('default', () => {
    const publicKey = PublicKey.from({
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    const serialized = PublicKey.toBytes(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `
    Uint8Array [
      4,
      131,
      24,
      83,
      91,
      84,
      16,
      93,
      74,
      122,
      174,
      96,
      192,
      143,
      196,
      95,
      150,
      135,
      24,
      27,
      79,
      223,
      198,
      37,
      189,
      26,
      117,
      63,
      167,
      57,
      127,
      237,
      117,
      53,
      71,
      241,
      28,
      168,
      105,
      102,
      70,
      242,
      243,
      172,
      176,
      142,
      49,
      1,
      106,
      250,
      194,
      62,
      99,
      12,
      93,
      17,
      245,
      159,
      97,
      254,
      245,
      123,
      13,
      42,
      165,
    ]
  `,
    )
  })
})

describe('PublicKey.validate', () => {
  test('default', () => {
    expect(
      PublicKey.validate({
        prefix: 4,
        x: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        y: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      }),
    ).toBe(true)
    expect(
      PublicKey.validate({
        prefix: 4,
        y: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      }),
    ).toBe(false)
  })
})

describe('PublicKey.toParts', () => {
  test('default', () => {
    const parts = PublicKey.toParts({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    expect(parts).toEqual({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
  })

  test('behavior: compressed', () => {
    const parts = PublicKey.toParts<true>({
      prefix: 3,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })
    expect(parts).toEqual({
      prefix: 3,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })
    expect('y' in parts).toBe(false)
  })

  test('behavior: returns a fresh object (no aliasing)', () => {
    const pk: PublicKey.PublicKey = {
      prefix: 4,
      x: '0x0000000000000000000000000000000000000000000000000000000000000001',
      y: '0x0000000000000000000000000000000000000000000000000000000000000002',
    }
    const parts = PublicKey.toParts(pk)
    expect(parts).not.toBe(pk)
  })
})

describe('PublicKey.fromParts', () => {
  test('default', () => {
    const publicKey = PublicKey.fromParts({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
    expect(publicKey).toEqual({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.fromParts<true>({
      prefix: 2,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })
    expect(publicKey).toEqual({
      prefix: 2,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })
    expect('y' in publicKey).toBe(false)
  })

  test('behavior: roundtrip', () => {
    const original: PublicKey.PublicKey = {
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    }
    expect(PublicKey.fromParts(PublicKey.toParts(original))).toEqual(original)
  })
})
