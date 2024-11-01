import { Mnemonic } from 'ox'
import { describe, expect, test } from 'vitest'

describe('random', () => {
  test('default', () => {
    expect(Mnemonic.random(Mnemonic.english).split(' ')).toHaveLength(12)
  })

  test('options: strength', () => {
    expect(
      Mnemonic.random(Mnemonic.english, { strength: 256 }).split(' '),
    ).toHaveLength(24)
  })
})

describe('toHdKey', () => {
  test('default', () => {
    const hdKey = Mnemonic.toHdKey(
      'test test test test test test test test test test test junk',
    ).derive(Mnemonic.path())
    expect(hdKey).toMatchInlineSnapshot(`
      {
        "depth": 5,
        "derive": [Function],
        "identifier": "0xa55476015c13afb8afb92160329a8cde976f1f2e",
        "index": 0,
        "privateExtendedKey": "xprvA3KbAeguosodJeRqpV3NF1VYREub6vBASfBEXa1LgZeqPAhCFkHQMBjXYPa8RZvP5tnWMSg2zYcox5vbsfz1pB7J2zU9LEzWxg7rrRpoeSh",
        "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "publicExtendedKey": "xpub6GJwaADoeFMvX8WJvWaNc9SGyGk5WNu1ot6qKxQxEuBpFy2LoHbetz41PgEcEg4n2bk3hWoHYJ69EqkjpoSv9KrinCnZV6y4Xo6VJZ6KHWT",
        "publicKey": {
          "prefix": 4,
          "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
          "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
        },
        "versions": {
          "private": 76066276,
          "public": 76067358,
        },
      }
    `)
  })
})

describe('toPrivateKey', () => {
  test('default', () => {
    const privateKey = Mnemonic.toPrivateKey(
      'test test test test test test test test test test test junk',
    )
    expect(privateKey).toMatchInlineSnapshot(
      `"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"`,
    )
  })

  test('options: as: bytes', () => {
    const privateKey = Mnemonic.toPrivateKey(
      'test test test test test test test test test test test junk',
      { as: 'Bytes' },
    )
    expect(privateKey).toMatchInlineSnapshot(
      `
    Uint8Array [
      172,
      9,
      116,
      190,
      195,
      154,
      23,
      227,
      107,
      164,
      166,
      180,
      210,
      56,
      255,
      148,
      75,
      172,
      180,
      120,
      203,
      237,
      94,
      252,
      174,
      120,
      77,
      123,
      244,
      242,
      255,
      128,
    ]
  `,
    )
  })
})

describe('toSeed', () => {
  const mnemonic =
    'buyer zoo end danger ice capable shrug naive twist relief mass bonus'

  test('default', () => {
    expect(Mnemonic.toSeed(mnemonic)).toMatchInlineSnapshot(`
  Uint8Array [
    8,
    147,
    69,
    25,
    237,
    18,
    53,
    60,
    175,
    72,
    79,
    138,
    23,
    228,
    195,
    171,
    103,
    106,
    95,
    197,
    252,
    176,
    71,
    236,
    31,
    249,
    24,
    248,
    58,
    229,
    138,
    41,
    71,
    198,
    129,
    77,
    149,
    249,
    46,
    182,
    135,
    217,
    196,
    58,
    113,
    173,
    129,
    38,
    188,
    124,
    193,
    229,
    82,
    248,
    173,
    249,
    109,
    120,
    112,
    64,
    80,
    199,
    16,
    222,
  ]
`)
  })

  test('options: as', () => {
    expect(Mnemonic.toSeed(mnemonic, { as: 'Hex' })).toMatchInlineSnapshot(
      `"0x08934519ed12353caf484f8a17e4c3ab676a5fc5fcb047ec1ff918f83ae58a2947c6814d95f92eb687d9c43a71ad8126bc7cc1e552f8adf96d78704050c710de"`,
    )
  })

  test('options: passphrase', () => {
    expect(
      Mnemonic.toSeed(mnemonic, { passphrase: 'qwerty' }),
    ).toMatchInlineSnapshot(`
  Uint8Array [
    64,
    108,
    165,
    12,
    109,
    126,
    152,
    1,
    80,
    8,
    203,
    241,
    216,
    111,
    106,
    109,
    78,
    52,
    108,
    69,
    105,
    71,
    171,
    117,
    238,
    161,
    154,
    8,
    150,
    115,
    117,
    36,
    130,
    174,
    230,
    149,
    137,
    86,
    207,
    89,
    84,
    204,
    60,
    227,
    123,
    174,
    79,
    159,
    69,
    88,
    244,
    72,
    95,
    67,
    188,
    79,
    146,
    241,
    247,
    101,
    157,
    194,
    248,
    124,
  ]
`)
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      Mnemonic.validate(
        'buyer zoo end danger ice capable shrug naive twist relief mass bonus',
        Mnemonic.english,
      ),
    ).toBe(true)
    expect(
      Mnemonic.validate(
        'buyer zoo end danger ice capable shrug naive twist relief mass wagmi',
        Mnemonic.english,
      ),
    ).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(Mnemonic)).toMatchInlineSnapshot(`
    [
      "path",
      "english",
      "czech",
      "french",
      "italian",
      "japanese",
      "korean",
      "portuguese",
      "simplifiedChinese",
      "spanish",
      "traditionalChinese",
      "random",
      "toHdKey",
      "toPrivateKey",
      "toSeed",
      "validate",
    ]
  `)
})
