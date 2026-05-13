import { Bytes, Hex, Rlp } from 'ox'
import { describe, expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(Rlp)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "decodeRlpCursor",
      "readLength",
      "readList",
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

describe('Rlp.decode', () => {
  test('no bytes', () => {
    const rlpHex = '0x'
    const rlpBytes = Uint8Array.from([])

    // hex -> bytes
    expect(Rlp.decode(rlpHex, { as: 'Bytes' })).toStrictEqual(
      new Uint8Array([]),
    )
    // hex -> hex
    expect(Rlp.decode(rlpHex, { as: 'Hex' })).toEqual('0x')
    // bytes -> bytes
    expect(Rlp.decode(rlpBytes, { as: 'Bytes' })).toStrictEqual(
      new Uint8Array([]),
    )
    // bytes -> hex
    expect(Rlp.decode(rlpBytes, { as: 'Hex' })).toEqual('0x')
  })

  describe('prefix < 0x80', () => {
    test('bytes -> bytes', () => {
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x00'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x00'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x01'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x01'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x42'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x42'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x7f'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x7f'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromString('!'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x21'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromString('a'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x61'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromString('~'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x7e'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromBoolean(true), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x01'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromBoolean(false), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x00'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromNumber(0), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x00'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromNumber(69), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x45'))
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromNumber(127), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x7f'))
    })

    test('bytes -> hex', () => {
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x00'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x00')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x01'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x01')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x42'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x42')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromHex('0x7f'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x7f')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromString('!'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x21')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromString('a'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x61')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromString('~'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x7e')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromBoolean(true), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x01')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromBoolean(false), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x00')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromNumber(0), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x00')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromNumber(69), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x45')
      expect(
        Rlp.decode(Rlp.encode(Bytes.fromNumber(127), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x7f')
    })

    test('hex -> hex', () => {
      expect(
        Rlp.decode(Rlp.encode('0x00', { as: 'Hex' }), { as: 'Hex' }),
      ).toEqual('0x00')
      expect(
        Rlp.decode(Rlp.encode('0x01', { as: 'Hex' }), { as: 'Hex' }),
      ).toEqual('0x01')
      expect(
        Rlp.decode(Rlp.encode('0x42', { as: 'Hex' }), { as: 'Hex' }),
      ).toEqual('0x42')
      expect(
        Rlp.decode(Rlp.encode('0x7f', { as: 'Hex' }), { as: 'Hex' }),
      ).toEqual('0x7f')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromString('!'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x21')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromString('a'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x61')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromString('~'), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x7e')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromBoolean(true), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x01')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromBoolean(false), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x00')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromNumber(0), { as: 'Hex' }), { as: 'Hex' }),
      ).toEqual('0x00')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromNumber(69), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x45')
      expect(
        Rlp.decode(Rlp.encode(Hex.fromNumber(127), { as: 'Hex' }), {
          as: 'Hex',
        }),
      ).toEqual('0x7f')
    })

    test('hex -> bytes', () => {
      expect(
        Rlp.decode(Rlp.encode('0x00', { as: 'Bytes' }), { as: 'Bytes' }),
      ).toEqual(Bytes.fromHex('0x00'))
      expect(
        Rlp.decode(Rlp.encode('0x01', { as: 'Bytes' }), { as: 'Bytes' }),
      ).toEqual(Bytes.fromHex('0x01'))
      expect(
        Rlp.decode(Rlp.encode('0x42', { as: 'Bytes' }), { as: 'Bytes' }),
      ).toEqual(Bytes.fromHex('0x42'))
      expect(
        Rlp.decode(Rlp.encode('0x7f', { as: 'Bytes' }), { as: 'Bytes' }),
      ).toEqual(Bytes.fromHex('0x7f'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromString('!'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x21'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromString('a'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x61'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromString('~'), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x7e'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromBoolean(true), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x01'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromBoolean(false), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x00'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromNumber(0), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x00'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromNumber(69), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x45'))
      expect(
        Rlp.decode(Rlp.encode(Hex.fromNumber(127), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(Bytes.fromHex('0x7f'))
    })
  })

  describe('list', () => {
    test('no bytes', () => {
      // bytes -> bytes
      expect(
        Rlp.decode(Rlp.encode([], { as: 'Bytes' }), { as: 'Bytes' }),
      ).toEqual([])
      // bytes -> hex
      expect(
        Rlp.decode(Rlp.encode([], { as: 'Bytes' }), { as: 'Hex' }),
      ).toEqual([])
      // hex -> hex
      expect(Rlp.decode(Rlp.encode([], { as: 'Hex' }), { as: 'Hex' })).toEqual(
        [],
      )
      // hex -> bytes
      expect(
        Rlp.decode(Rlp.encode([], { as: 'Hex' }), { as: 'Bytes' }),
      ).toEqual([])
    })

    test('inner no bytes', () => {
      // bytes -> bytes
      expect(
        Rlp.decode(Rlp.encode([[]], { as: 'Bytes' }), { as: 'Bytes' }),
      ).toEqual([[]])
      // bytes -> hex
      expect(
        Rlp.decode(Rlp.encode([[]], { as: 'Bytes' }), { as: 'Hex' }),
      ).toEqual([[]])
      // hex -> hex
      expect(
        Rlp.decode(Rlp.encode([[]], { as: 'Hex' }), { as: 'Hex' }),
      ).toEqual([[]])
      // hex -> bytes
      expect(
        Rlp.decode(Rlp.encode([[]], { as: 'Hex' }), { as: 'Bytes' }),
      ).toEqual([[]])
    })

    describe('prefix < 0xf8', () => {
      test('bytes -> bytes', () => {
        expect(
          Rlp.decode(Rlp.encode([Bytes.fromHex('0x00')], { as: 'Bytes' }), {
            as: 'Bytes',
          }),
        ).toEqual([Bytes.fromHex('0x00')])
        expect(
          Rlp.decode(Rlp.encode([Bytes.fromHex('0x80')], { as: 'Bytes' }), {
            as: 'Bytes',
          }),
        ).toEqual([Bytes.fromHex('0x80')])
        expect(
          Rlp.decode(Rlp.encode(generateList(14), { as: 'Bytes' }), {
            as: 'Bytes',
          }),
        ).toEqual(generateList(14))
        expect(
          Rlp.decode(
            Rlp.encode(
              [
                generateList(4),
                [generateList(8), [generateList(3), generateBytes(1)]],
              ],
              { as: 'Bytes' },
            ),
            { as: 'Bytes' },
          ),
        ).toEqual([
          generateList(4),
          [generateList(8), [generateList(3), generateBytes(1)]],
        ])
      })

      test('bytes -> hex', () => {
        expect(
          Rlp.decode(Rlp.encode(['0x00'], { as: 'Bytes' }), { as: 'Hex' }),
        ).toEqual(['0x00'])
        expect(
          Rlp.decode(Rlp.encode(['0x80'], { as: 'Bytes' }), { as: 'Hex' }),
        ).toEqual(['0x80'])
        expect(
          Rlp.decode(Rlp.encode(generateList(14), { as: 'Bytes' }), {
            as: 'Hex',
          }),
        ).toEqual(generateList(14).map((x) => Hex.fromBytes(x)))
        expect(
          Rlp.decode(
            Rlp.encode(
              [
                generateList(4),
                [generateList(8), [generateList(3), generateBytes(1)]],
              ],
              { as: 'Bytes' },
            ),
            { as: 'Hex' },
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
        expect(
          Rlp.decode(Rlp.encode(['0x00'], { as: 'Hex' }), { as: 'Hex' }),
        ).toEqual(['0x00'])
        expect(
          Rlp.decode(Rlp.encode(['0x80'], { as: 'Hex' }), { as: 'Hex' }),
        ).toEqual(['0x80'])
        expect(
          Rlp.decode(
            Rlp.encode(
              generateList(14).map((x) => Hex.fromBytes(x)),
              { as: 'Hex' },
            ),
            { as: 'Hex' },
          ),
        ).toEqual(generateList(14).map((x) => Hex.fromBytes(x)))
        expect(
          Rlp.decode(
            Rlp.encode(
              [
                generateList(4).map((x) => Hex.fromBytes(x)),
                [
                  generateList(8).map((x) => Hex.fromBytes(x)),
                  [
                    generateList(3).map((x) => Hex.fromBytes(x)),
                    Hex.fromBytes(generateBytes(1)),
                  ],
                ],
              ],
              { as: 'Hex' },
            ),
            { as: 'Hex' },
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
        expect(
          Rlp.decode(Rlp.encode(['0x00'], { as: 'Hex' }), { as: 'Bytes' }),
        ).toEqual([Bytes.fromHex('0x00')])
        expect(
          Rlp.decode(Rlp.encode(['0x80'], { as: 'Hex' }), { as: 'Bytes' }),
        ).toEqual([Bytes.fromHex('0x80')])
        expect(
          Rlp.decode(Rlp.encode(generateList(14), { as: 'Hex' }), {
            as: 'Bytes',
          }),
        ).toEqual(generateList(14))
        expect(
          Rlp.decode(
            Rlp.encode(
              [
                generateList(4),
                [generateList(8), [generateList(3), generateBytes(1)]],
              ],
              { as: 'Hex' },
            ),
            { as: 'Bytes' },
          ),
        ).toEqual([
          generateList(4),
          [generateList(8), [generateList(3), generateBytes(1)]],
        ])
      })
    })

    test('prefix === 0xf9', () => {
      expect(
        Rlp.decode(Rlp.encode(generateList(61), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(generateList(61))
      expect(
        Rlp.decode(Rlp.encode(generateList(12_000), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(generateList(12_000))
    })

    test('prefix === 0xfa', () => {
      expect(
        Rlp.decode(Rlp.encode(generateList(60_000), { as: 'Bytes' }), {
          as: 'Bytes',
        }),
      ).toEqual(generateList(60_000))
    })
  })

  test('error: invalid hex value', () => {
    expect(() =>
      Rlp.decode('0x010', { as: 'Hex' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
    [Hex.InvalidLengthError: Hex value \`"0x010"\` is an odd length (3 nibbles).

    It must be an even length.]
  `,
    )
  })
})
