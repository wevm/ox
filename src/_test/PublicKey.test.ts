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
    PublicKey.assert({ prefix: 2, x: 1n })
    PublicKey.assert({ prefix: 3, x: 1n })

    expect(() =>
      PublicKey.assert({ x: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `,
    )
    expect(() =>
      PublicKey.assert({ prefix: 5, x: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `)
  })

  test('uncompressed', () => {
    PublicKey.assert({ prefix: 4, x: 1n, y: 1n })

    expect(() =>
      PublicKey.assert({ x: 1n, y: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
    expect(() =>
      PublicKey.assert({ prefix: 3, x: 1n, y: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "3" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
    expect(() =>
      PublicKey.assert({ prefix: 5, x: 1n, y: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
  })

  test('unknown', () => {
    expect(() =>
      PublicKey.assert({ y: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
    [PublicKey.InvalidError: Value \`{"y":"1#__bigint"}\` is not a valid public key.

    Public key must contain:
    - an \`x\` and \`prefix\` value (compressed)
    - an \`x\`, \`y\`, and \`prefix\` value (uncompressed)]
  `,
    )
  })
})

describe('PublicKey.compress', () => {
  test('default', () => {
    {
      const publicKey = PublicKey.compress({
        prefix: 4,
        x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      })
      expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 3,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    }
  `)
    }

    {
      const publicKey = PublicKey.compress({
        prefix: 4,
        x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        y: 24099691209996290925259367678540227198235484593389470330605641003500238088870n,
      })
      expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 2,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    }
  `)
  })
})

describe('PublicKey.from', () => {
  test('uncompressed', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    })
    expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 4,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    }
  `)
  })

  test('uncompressed, no prefix', () => {
    const publicKey = PublicKey.from({
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    })
    expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 4,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    }
  `)
  })

  test('compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    })
    expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 3,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    }
  `)
  })

  test('compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 2,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    })
    expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 2,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
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
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    }
  `)
  })
})

describe('PublicKey.toHex', () => {
  test('default', () => {
    const publicKey = PublicKey.from({
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
    )
  })

  test('behavior: prefix', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
    )
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75"`,
    )
  })

  test('option: includePrefix', () => {
    const publicKey = PublicKey.from({
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
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
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
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
        x: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
        y: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      }),
    ).toBe(true)
    expect(
      PublicKey.validate({
        prefix: 4,
        y: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      }),
    ).toBe(false)
  })
})
