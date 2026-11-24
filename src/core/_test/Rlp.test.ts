import { Bytes, Hex, Rlp } from 'ox'
import { describe, expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(Rlp)).toMatchInlineSnapshot(`
    [
      "toBytes",
      "toHex",
      "to",
      "decodeRlpCursor",
      "readLength",
      "readList",
      "from",
      "fromBytes",
      "fromHex",
      "DepthLimitExceededError",
      "ListBoundaryExceededError",
      "TrailingBytesError",
      "NonCanonicalError",
    ]
  `)
})

const generateBytes = (length: number) => {
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) bytes[i] = i
  return bytes
}

const generateList = (length: number) => {
  const bytes: Uint8Array[] = []
  for (let i = 0; i < length; i++) bytes.push(generateBytes(i % 8))
  return bytes
}

describe('Rlp.to', () => {
  test('no bytes', () => {
    const rlpHex = '0x'
    const rlpBytes = Uint8Array.from([])

    // hex -> bytes
    expect(Rlp.toBytes(rlpHex)).toStrictEqual(new Uint8Array([]))
    // hex -> hex
    expect(Rlp.toHex(rlpHex)).toEqual('0x')
    // bytes -> bytes
    expect(Rlp.toBytes(rlpBytes)).toStrictEqual(new Uint8Array([]))
    // bytes -> hex
    expect(Rlp.toHex(rlpBytes)).toEqual('0x')
  })

  describe('prefix < 0x80', () => {
    test('bytes -> bytes', () => {
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromHex('0x00')))).toEqual(
        Bytes.fromHex('0x00'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromHex('0x01')))).toEqual(
        Bytes.fromHex('0x01'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromHex('0x42')))).toEqual(
        Bytes.fromHex('0x42'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromHex('0x7f')))).toEqual(
        Bytes.fromHex('0x7f'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromString('!')))).toEqual(
        Bytes.fromHex('0x21'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromString('a')))).toEqual(
        Bytes.fromHex('0x61'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromString('~')))).toEqual(
        Bytes.fromHex('0x7e'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromBoolean(true)))).toEqual(
        Bytes.fromHex('0x01'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromBoolean(false)))).toEqual(
        Bytes.fromHex('0x00'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromNumber(0)))).toEqual(
        Bytes.fromHex('0x00'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromNumber(69)))).toEqual(
        Bytes.fromHex('0x45'),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(Bytes.fromNumber(127)))).toEqual(
        Bytes.fromHex('0x7f'),
      )
    })

    test('bytes -> hex', () => {
      expect(Rlp.toHex(Rlp.from(Bytes.fromHex('0x00'), { as: 'Hex' }))).toEqual(
        '0x00',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromHex('0x01'), { as: 'Hex' }))).toEqual(
        '0x01',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromHex('0x42'), { as: 'Hex' }))).toEqual(
        '0x42',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromHex('0x7f'), { as: 'Hex' }))).toEqual(
        '0x7f',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromString('!'), { as: 'Hex' }))).toEqual(
        '0x21',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromString('a'), { as: 'Hex' }))).toEqual(
        '0x61',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromString('~'), { as: 'Hex' }))).toEqual(
        '0x7e',
      )
      expect(
        Rlp.toHex(Rlp.from(Bytes.fromBoolean(true), { as: 'Hex' })),
      ).toEqual('0x01')
      expect(
        Rlp.toHex(Rlp.from(Bytes.fromBoolean(false), { as: 'Hex' })),
      ).toEqual('0x00')
      expect(Rlp.toHex(Rlp.from(Bytes.fromNumber(0), { as: 'Hex' }))).toEqual(
        '0x00',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromNumber(69), { as: 'Hex' }))).toEqual(
        '0x45',
      )
      expect(Rlp.toHex(Rlp.from(Bytes.fromNumber(127), { as: 'Hex' }))).toEqual(
        '0x7f',
      )
    })

    test('hex -> hex', () => {
      expect(Rlp.toHex(Rlp.from('0x00', { as: 'Hex' }))).toEqual('0x00')
      expect(Rlp.toHex(Rlp.from('0x01', { as: 'Hex' }))).toEqual('0x01')
      expect(Rlp.toHex(Rlp.from('0x42', { as: 'Hex' }))).toEqual('0x42')
      expect(Rlp.toHex(Rlp.fromHex('0x7f'))).toEqual('0x7f')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromString('!')))).toEqual('0x21')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromString('a')))).toEqual('0x61')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromString('~')))).toEqual('0x7e')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromBoolean(true)))).toEqual('0x01')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromBoolean(false)))).toEqual('0x00')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromNumber(0)))).toEqual('0x00')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromNumber(69)))).toEqual('0x45')
      expect(Rlp.toHex(Rlp.fromHex(Hex.fromNumber(127)))).toEqual('0x7f')
    })

    test('hex -> bytes', () => {
      expect(Rlp.toBytes(Rlp.from('0x00', { as: 'Bytes' }))).toEqual(
        Bytes.fromHex('0x00'),
      )
      expect(Rlp.toBytes(Rlp.from('0x01', { as: 'Bytes' }))).toEqual(
        Bytes.fromHex('0x01'),
      )
      expect(Rlp.toBytes(Rlp.from('0x42', { as: 'Bytes' }))).toEqual(
        Bytes.fromHex('0x42'),
      )
      expect(Rlp.toBytes(Rlp.from('0x7f', { as: 'Bytes' }))).toEqual(
        Bytes.fromHex('0x7f'),
      )
      expect(
        Rlp.toBytes(Rlp.from(Hex.fromString('!'), { as: 'Bytes' })),
      ).toEqual(Bytes.fromHex('0x21'))
      expect(
        Rlp.toBytes(Rlp.from(Hex.fromString('a'), { as: 'Bytes' })),
      ).toEqual(Bytes.fromHex('0x61'))
      expect(
        Rlp.toBytes(Rlp.from(Hex.fromString('~'), { as: 'Bytes' })),
      ).toEqual(Bytes.fromHex('0x7e'))
      expect(
        Rlp.toBytes(Rlp.from(Hex.fromBoolean(true), { as: 'Bytes' })),
      ).toEqual(Bytes.fromHex('0x01'))
      expect(
        Rlp.toBytes(Rlp.from(Hex.fromBoolean(false), { as: 'Bytes' })),
      ).toEqual(Bytes.fromHex('0x00'))
      expect(Rlp.toBytes(Rlp.from(Hex.fromNumber(0), { as: 'Bytes' }))).toEqual(
        Bytes.fromHex('0x00'),
      )
      expect(
        Rlp.toBytes(Rlp.from(Hex.fromNumber(69), { as: 'Bytes' })),
      ).toEqual(Bytes.fromHex('0x45'))
      expect(
        Rlp.toBytes(Rlp.from(Hex.fromNumber(127), { as: 'Bytes' })),
      ).toEqual(Bytes.fromHex('0x7f'))
    })
  })

  describe('list', () => {
    test('no bytes', () => {
      // bytes -> bytes
      expect(Rlp.toBytes(Rlp.fromBytes([]))).toEqual([])
      // bytes -> hex
      expect(Rlp.toHex(Rlp.fromBytes([]))).toEqual([])
      // hex -> hex
      expect(Rlp.toHex(Rlp.fromHex([]))).toEqual([])
      // hex -> bytes
      expect(Rlp.toBytes(Rlp.fromHex([]))).toEqual([])
    })

    test('inner no bytes', () => {
      // bytes -> bytes
      expect(Rlp.toBytes(Rlp.fromBytes([[]]))).toEqual([[]])
      // bytes -> hex
      expect(Rlp.toHex(Rlp.fromBytes([[]]))).toEqual([[]])
      // hex -> hex
      expect(Rlp.toHex(Rlp.fromHex([[]]))).toEqual([[]])
      // hex -> bytes
      expect(Rlp.toBytes(Rlp.fromHex([[]]))).toEqual([[]])
    })

    describe('prefix < 0xf8', () => {
      test('bytes -> bytes', () => {
        expect(Rlp.toBytes(Rlp.fromBytes([Bytes.fromHex('0x00')]))).toEqual([
          Bytes.fromHex('0x00'),
        ])
        expect(Rlp.toBytes(Rlp.fromBytes([Bytes.fromHex('0x80')]))).toEqual([
          Bytes.fromHex('0x80'),
        ])
        expect(Rlp.toBytes(Rlp.fromBytes(generateList(14)))).toEqual(
          generateList(14),
        )
        expect(
          Rlp.toBytes(
            Rlp.fromBytes([
              generateList(4),
              [generateList(8), [generateList(3), generateBytes(1)]],
            ]),
          ),
        ).toEqual([
          generateList(4),
          [generateList(8), [generateList(3), generateBytes(1)]],
        ])
      })

      test('bytes -> hex', () => {
        expect(Rlp.toHex(Rlp.from(['0x00'], { as: 'Bytes' }))).toEqual(['0x00'])
        expect(Rlp.toHex(Rlp.from(['0x80'], { as: 'Bytes' }))).toEqual(['0x80'])
        expect(Rlp.toHex(Rlp.from(generateList(14), { as: 'Bytes' }))).toEqual(
          generateList(14).map((x) => Hex.fromBytes(x)),
        )
        expect(
          Rlp.toHex(
            Rlp.from(
              [
                generateList(4),
                [generateList(8), [generateList(3), generateBytes(1)]],
              ],
              { as: 'Bytes' },
            ),
          ),
        ).toEqual([
          generateList(4).map((x) => Hex.fromBytes(x)),
          [
            generateList(8).map((x) => Hex.fromBytes(x)),
            [
              generateList(3).map((x) => Hex.fromBytes(x)),
              Hex.fromBytes(generateBytes(1)),
            ],
          ],
        ])
      })

      test('hex -> hex', () => {
        expect(Rlp.toHex(Rlp.fromHex(['0x00']))).toEqual(['0x00'])
        expect(Rlp.toHex(Rlp.fromHex(['0x80']))).toEqual(['0x80'])
        expect(
          Rlp.toHex(Rlp.fromHex(generateList(14).map((x) => Hex.fromBytes(x)))),
        ).toEqual(generateList(14).map((x) => Hex.fromBytes(x)))
        expect(
          Rlp.toHex(
            Rlp.fromHex([
              generateList(4).map((x) => Hex.fromBytes(x)),
              [
                generateList(8).map((x) => Hex.fromBytes(x)),
                [
                  generateList(3).map((x) => Hex.fromBytes(x)),
                  Hex.fromBytes(generateBytes(1)),
                ],
              ],
            ]),
          ),
        ).toEqual([
          generateList(4).map((x) => Hex.fromBytes(x)),
          [
            generateList(8).map((x) => Hex.fromBytes(x)),
            [
              generateList(3).map((x) => Hex.fromBytes(x)),
              Hex.fromBytes(generateBytes(1)),
            ],
          ],
        ])
      })

      test('hex -> bytes', () => {
        expect(Rlp.toBytes(Rlp.from(['0x00'], { as: 'Hex' }))).toEqual([
          Bytes.fromHex('0x00'),
        ])
        expect(Rlp.toBytes(Rlp.from(['0x80'], { as: 'Hex' }))).toEqual([
          Bytes.fromHex('0x80'),
        ])
        expect(Rlp.toBytes(Rlp.from(generateList(14), { as: 'Hex' }))).toEqual(
          generateList(14),
        )
        expect(
          Rlp.toBytes(
            Rlp.from(
              [
                generateList(4),
                [generateList(8), [generateList(3), generateBytes(1)]],
              ],
              { as: 'Hex' },
            ),
          ),
        ).toEqual([
          generateList(4),
          [generateList(8), [generateList(3), generateBytes(1)]],
        ])
      })
    })

    test('prefix === 0xf9', () => {
      expect(Rlp.toBytes(Rlp.fromBytes(generateList(61)))).toEqual(
        generateList(61),
      )
      expect(Rlp.toBytes(Rlp.fromBytes(generateList(12_000)))).toEqual(
        generateList(12_000),
      )
    })

    test('prefix === 0xfa', () => {
      expect(Rlp.toBytes(Rlp.fromBytes(generateList(60_000)))).toEqual(
        generateList(60_000),
      )
    })
  })

  test('error: invalid hex value', () => {
    expect(() => Rlp.toHex('0x010')).toThrowErrorMatchingInlineSnapshot(
      `
    [Hex.InvalidLengthError: Hex value \`"0x010"\` is an odd length (3 nibbles).

    It must be an even length.]
  `,
    )
  })
})

describe('decode depth limit', () => {
  // Builds an RLP-encoded value of `depth` nested empty lists without recursing
  // (so we can exceed the decoder's depth limit without overflowing the encoder).
  const nestedEmptyLists = (depth: number) => {
    let bytes = Uint8Array.from([0xc0])
    for (let i = 0; i < depth; i++) {
      const length = bytes.length
      const prefix =
        length <= 55
          ? [0xc0 + length]
          : (() => {
              const lengthBytes: number[] = []
              let n = length
              while (n > 0) {
                lengthBytes.unshift(n & 0xff)
                n >>= 8
              }
              return [0xf7 + lengthBytes.length, ...lengthBytes]
            })()
      const next = new Uint8Array(prefix.length + bytes.length)
      next.set(prefix, 0)
      next.set(bytes, prefix.length)
      bytes = next
    }
    return bytes
  }

  test('decodes up to the depth limit', () => {
    expect(() => Rlp.toBytes(nestedEmptyLists(1_023))).not.toThrow()
  })

  test('throws when the depth limit is exceeded', () => {
    expect(() =>
      Rlp.toBytes(nestedEmptyLists(2_000)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.DepthLimitExceededError: RLP depth limit of \`1024\` exceeded.]`,
    )
  })
})

describe('trailing bytes', () => {
  // RLP payloads encode exactly one item (Yellow Paper, Appendix B).
  test('after string item', () => {
    expect(() => Rlp.toHex('0x80deadbeef')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.TrailingBytesError: RLP payload encodes a single item, but \`4\` trailing bytes remain.]`,
    )
  })

  test('after list item', () => {
    expect(() => Rlp.toHex('0xc2010203')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.TrailingBytesError: RLP payload encodes a single item, but \`1\` trailing byte remains.]`,
    )
  })

  test('after empty list', () => {
    expect(() => Rlp.toHex('0xc000')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.TrailingBytesError: RLP payload encodes a single item, but \`1\` trailing byte remains.]`,
    )
  })

  test('bytes input', () => {
    expect(() =>
      Rlp.toHex(Uint8Array.from([0x80, 0xde, 0xad])),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.TrailingBytesError: RLP payload encodes a single item, but \`2\` trailing bytes remain.]`,
    )
  })

  test('valid single items still decode', () => {
    expect(Rlp.toHex('0x80')).toEqual('0x')
    expect(Rlp.toHex('0xc0')).toEqual([])
    expect(Rlp.toHex('0xc1c0')).toEqual([[]])
    expect(Rlp.toHex('0x83646f67')).toEqual('0x646f67')
  })
})

describe('list boundary', () => {
  // Items must consume exactly the declared list length.
  test('item extends beyond list', () => {
    // `0xc1` declares 1 payload byte; `0x82aabb` consumes 3.
    expect(() => Rlp.toHex('0xc182aabb')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.ListBoundaryExceededError: RLP list items consumed \`3\` bytes but the list declared a length of \`1\`.]`,
    )
  })

  test('item extends beyond nested list', () => {
    expect(() => Rlp.toHex('0xc3c182aabb')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.ListBoundaryExceededError: RLP list items consumed \`3\` bytes but the list declared a length of \`1\`.]`,
    )
  })

  test('readList: list longer than the bytes', () => {
    expect(() =>
      Rlp.readList({ bytes: new Uint8Array(), position: 0 }, 1, 'Hex'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Cursor.PositionOutOfBoundsError: Position \`0\` is out of bounds (\`0 < position < 0\`).]`,
    )
  })

  test('item extends beyond list with trailing bytes', () => {
    expect(() => Rlp.toHex('0xc182aabbff')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.ListBoundaryExceededError: RLP list items consumed \`3\` bytes but the list declared a length of \`1\`.]`,
    )
  })
})

describe('non-canonical encoding', () => {
  // RLP is a bijection: every value has exactly one valid encoding (Yellow
  // Paper, Appendix B). A decoder that accepts alternate encodings of the
  // same value breaks that bijection and enables hash/identity malleability.
  test('single byte < 0x80 wrapped in a length-1 prefix', () => {
    expect(() => Rlp.toHex('0x8100')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.NonCanonicalError: RLP payload is not canonically encoded: single byte \`0x00\` is wrapped in an explicit length prefix instead of being encoded as itself.]`,
    )
    expect(() => Rlp.toHex('0x817f')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.NonCanonicalError: RLP payload is not canonically encoded: single byte \`0x7f\` is wrapped in an explicit length prefix instead of being encoded as itself.]`,
    )
  })

  test('single byte >= 0x80 correctly requires a length-1 prefix', () => {
    expect(Rlp.toHex('0x8180')).toMatchInlineSnapshot(`"0x80"`)
    expect(Rlp.toHex('0x8185')).toMatchInlineSnapshot(`"0x85"`)
  })

  test('long-form length that fits the short form', () => {
    // `0xb8` = long-form 1-byte-length string prefix; `0x00` declares length 0,
    // which must instead be encoded directly as the short-form `0x80`.
    expect(() => Rlp.toHex('0xb800')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.NonCanonicalError: RLP payload is not canonically encoded: length \`0\` fits in the short form and must not use a one-byte length prefix.]`,
    )
    // declares length 1 (`0x41`), which fits the short form (`0x41` directly).
    expect(() => Rlp.toHex('0xb80141')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.NonCanonicalError: RLP payload is not canonically encoded: length \`1\` fits in the short form and must not use a one-byte length prefix.]`,
    )
    // list variant: `0xf8` = long-form 1-byte-length list prefix, length 2.
    expect(() => Rlp.toHex('0xf8020102')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.NonCanonicalError: RLP payload is not canonically encoded: length \`2\` fits in the short form and must not use a one-byte length prefix.]`,
    )
  })

  test('long-form length with a leading zero length-byte', () => {
    // `0xb9` = long-form 2-byte-length string prefix; `0x0001` (leading zero)
    // declares length 1, which fits in a single length-byte.
    expect(() => Rlp.toHex('0xb9000141')).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.NonCanonicalError: RLP payload is not canonically encoded: length \`1\` fits in fewer length-bytes and must not use a two-byte length prefix.]`,
    )
  })

  test('long-form lengths at exact byte-count boundaries still decode', () => {
    const bytes56 = `0x${'ab'.repeat(56)}` as const
    expect(Rlp.toHex(Rlp.fromHex(bytes56))).toEqual(bytes56)
    const bytes256 = `0x${'cd'.repeat(256)}` as const
    expect(Rlp.toHex(Rlp.fromHex(bytes256))).toEqual(bytes256)
  })
})

describe('hex leaves', () => {
  test('encode like their bytes: any case, odd length', () => {
    const leaves = ['0xABcd', '0x1', '0x0', '0x', '0x7F', '0x80'] as Hex.Hex[]
    const bytes = leaves.map((leaf) => Bytes.fromHex(leaf))
    expect(Rlp.fromHex([...leaves, [...leaves]])).toEqual(
      Rlp.fromBytes([...bytes, [...bytes]], { as: 'Hex' }),
    )
    expect(Rlp.fromHex([...leaves, [...leaves]], { as: 'Bytes' })).toEqual(
      Rlp.fromBytes([...bytes, [...bytes]]),
    )
    expect(() => Rlp.fromHex(['0x0g'])).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Invalid byte sequence ("0g" in "0g").]`,
    )
    expect(() =>
      Rlp.fromHex(['0x01', 'abcd' as Hex.Hex]),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Hex value \`abcd\` must start with "0x".]`,
    )
  })

  test('a leaf that is neither hex nor bytes throws', () => {
    // Encoded as an empty string, it would let a transaction with a mistyped
    // `to` or `data` serialize and hash without one.
    for (const leaf of [0, 1n, true, {}]) {
      const value = ['0x01', [leaf]] as never
      expect(() => Rlp.fromHex(value)).toThrow('Length is too large.')
      expect(() => Rlp.fromBytes(value)).toThrow('Length is too large.')
    }
  })

  test('decode to lowercase hex, from hex or bytes', () => {
    const encoded = Rlp.fromHex([
      '0xabcdef',
      ['0x', '0x7f'],
      `0x${'ab'.repeat(60)}`,
    ])
    const expected = ['0xabcdef', ['0x', '0x7f'], `0x${'ab'.repeat(60)}`]
    expect(Rlp.toHex(encoded)).toEqual(expected)
    expect(
      Rlp.toHex(encoded.toUpperCase().replace('0X', '0x') as Hex.Hex),
    ).toEqual(expected)
    expect(Rlp.toHex(Bytes.fromHex(encoded))).toEqual(expected)
    // Longer than the inputs whose leaves are cut from the input string.
    const long = `0x${'ab'.repeat(3000)}` as const
    expect(Rlp.toHex(Rlp.fromHex([long, '0x01']))).toEqual([long, '0x01'])
  })
})
