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
    PublicKey.assert({ prefix: 2, x: '0x1' })
    PublicKey.assert({ prefix: 3, x: '0x1' })

    expect(() =>
      PublicKey.assert({ x: '0x1' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `,
    )
    expect(() =>
      PublicKey.assert({ prefix: 5, x: '0x1' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `)
  })

  test('uncompressed', () => {
    PublicKey.assert({ prefix: 4, x: '0x1', y: '0x2' })

    expect(() =>
      PublicKey.assert({ x: '0x1', y: '0x2' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
    expect(() =>
      PublicKey.assert({ prefix: 3, x: '0x1', y: '0x2' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "3" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
    expect(() =>
      PublicKey.assert({ prefix: 5, x: '0x1', y: '0x2' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
  })

  test('unknown', () => {
    expect(() =>
      PublicKey.assert({ y: '0x2' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [PublicKey.InvalidError: Value \`{"y":"0x2"}\` is not a valid public key.

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
        x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
        y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
      })
      expect(publicKey).toMatchInlineSnapshot(`
        {
          "prefix": 2,
          "x": "0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996",
        }
      `)
    }

    {
      const publicKey = PublicKey.compress({
        prefix: 4,
        x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
        y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
      })
      expect(publicKey).toMatchInlineSnapshot(`
        {
          "prefix": 2,
          "x": "0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996",
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
})

describe('PublicKey.from', () => {
  test('uncompressed', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996",
        "y": "0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0",
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
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996",
        "y": "0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0",
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
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 3,
        "x": "0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996",
      }
    `)
  })

  test('compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 2,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 2,
        "x": "0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996",
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
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x04a363666d74646e6f6e656761747453746d74a06861757468446174615898499655f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0"`,
    )
  })

  test('behavior: prefix', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x04a363666d74646e6f6e656761747453746d74a06861757468446174615898499655f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0"`,
    )
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
    })
    const serialized = PublicKey.toHex(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `"0x03a363666d74646e6f6e656761747453746d74a068617574684461746158984996"`,
    )
  })

  test('option: includePrefix', () => {
    const publicKey = PublicKey.from({
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })
    const serialized = PublicKey.toHex(publicKey, { includePrefix: false })
    expect(serialized).toMatchInlineSnapshot(
      `"0xa363666d74646e6f6e656761747453746d74a06861757468446174615898499655f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0"`,
    )
  })
})

describe('PublicKey.toBytes', () => {
  test('default', () => {
    const publicKey = PublicKey.from({
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })
    const serialized = PublicKey.toBytes(publicKey)
    expect(serialized).toMatchInlineSnapshot(
      `
      Uint8Array [
        4,
        163,
        99,
        102,
        109,
        116,
        100,
        110,
        111,
        110,
        101,
        103,
        97,
        116,
        116,
        83,
        116,
        109,
        116,
        160,
        104,
        97,
        117,
        116,
        104,
        68,
        97,
        116,
        97,
        88,
        152,
        73,
        150,
        85,
        244,
        52,
        61,
        197,
        231,
        58,
        177,
        210,
        145,
        174,
        114,
        204,
        165,
        1,
        2,
        3,
        38,
        32,
        1,
        33,
        88,
        32,
        238,
        231,
        44,
        79,
        198,
        110,
        38,
        112,
        176,
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
        x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
        y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
      }),
    ).toBe(true)
    expect(
      PublicKey.validate({
        prefix: 4,
        y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
      }),
    ).toBe(false)
  })
})
