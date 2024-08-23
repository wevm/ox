import { Bytes, Hex, Rlp } from 'ox'
import { describe, expect, test } from 'vitest'

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

test('no bytes', () => {
  const rlpHex = '0x'
  const rlpBytes = Uint8Array.from([])

  // hex -> bytes
  expect(Rlp.toBytes(rlpHex)).toStrictEqual(new Uint8Array([]))
  // hex -> hex
  expect(Rlp.decode(rlpHex)).toEqual('0x')
  // bytes -> bytes
  expect(Rlp.decode(rlpBytes)).toStrictEqual(new Uint8Array([]))
  // bytes -> hex
  expect(Rlp.toHex(rlpBytes)).toEqual('0x')
})

describe('prefix < 0x80', () => {
  test('bytes -> bytes', () => {
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromHex('0x00')))).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromHex('0x01')))).toEqual(
      Bytes.fromHex('0x01'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromHex('0x42')))).toEqual(
      Bytes.fromHex('0x42'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromHex('0x7f')))).toEqual(
      Bytes.fromHex('0x7f'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromString('!')))).toEqual(
      Bytes.fromHex('0x21'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromString('a')))).toEqual(
      Bytes.fromHex('0x61'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromString('~')))).toEqual(
      Bytes.fromHex('0x7e'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromBoolean(true)))).toEqual(
      Bytes.fromHex('0x01'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromBoolean(false)))).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromNumber(0)))).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromNumber(69)))).toEqual(
      Bytes.fromHex('0x45'),
    )
    expect(Rlp.decode(Rlp.fromBytes(Bytes.fromNumber(127)))).toEqual(
      Bytes.fromHex('0x7f'),
    )
  })

  test('bytes -> hex', () => {
    expect(Rlp.decode(Rlp.encode(Bytes.fromHex('0x00'), 'Hex'))).toEqual('0x00')
    expect(Rlp.decode(Rlp.encode(Bytes.fromHex('0x01'), 'Hex'))).toEqual('0x01')
    expect(Rlp.decode(Rlp.encode(Bytes.fromHex('0x42'), 'Hex'))).toEqual('0x42')
    expect(Rlp.decode(Rlp.encode(Bytes.fromHex('0x7f'), 'Hex'))).toEqual('0x7f')
    expect(Rlp.decode(Rlp.encode(Bytes.fromString('!'), 'Hex'))).toEqual('0x21')
    expect(Rlp.decode(Rlp.encode(Bytes.fromString('a'), 'Hex'))).toEqual('0x61')
    expect(Rlp.decode(Rlp.encode(Bytes.fromString('~'), 'Hex'))).toEqual('0x7e')
    expect(Rlp.decode(Rlp.encode(Bytes.fromBoolean(true), 'Hex'))).toEqual(
      '0x01',
    )
    expect(Rlp.decode(Rlp.encode(Bytes.fromBoolean(false), 'Hex'))).toEqual(
      '0x00',
    )
    expect(Rlp.decode(Rlp.encode(Bytes.fromNumber(0), 'Hex'))).toEqual('0x00')
    expect(Rlp.decode(Rlp.encode(Bytes.fromNumber(69), 'Hex'))).toEqual('0x45')
    expect(Rlp.decode(Rlp.encode(Bytes.fromNumber(127), 'Hex'))).toEqual('0x7f')
  })

  test('hex -> hex', () => {
    expect(Rlp.decode(Rlp.encode('0x00'))).toEqual('0x00')
    expect(Rlp.decode(Rlp.encode('0x01'))).toEqual('0x01')
    expect(Rlp.decode(Rlp.encode('0x42'))).toEqual('0x42')
    expect(Rlp.decode(Rlp.fromHex('0x7f'))).toEqual('0x7f')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromString('!')))).toEqual('0x21')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromString('a')))).toEqual('0x61')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromString('~')))).toEqual('0x7e')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromBoolean(true)))).toEqual('0x01')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromBoolean(false)))).toEqual('0x00')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromNumber(0)))).toEqual('0x00')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromNumber(69)))).toEqual('0x45')
    expect(Rlp.decode(Rlp.fromHex(Hex.fromNumber(127)))).toEqual('0x7f')
  })

  test('hex -> bytes', () => {
    expect(Rlp.decode(Rlp.encode('0x00', 'Bytes'))).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.decode(Rlp.encode('0x01', 'Bytes'))).toEqual(
      Bytes.fromHex('0x01'),
    )
    expect(Rlp.decode(Rlp.encode('0x42', 'Bytes'))).toEqual(
      Bytes.fromHex('0x42'),
    )
    expect(Rlp.decode(Rlp.encode('0x7f', 'Bytes'))).toEqual(
      Bytes.fromHex('0x7f'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromString('!'), 'Bytes'))).toEqual(
      Bytes.fromHex('0x21'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromString('a'), 'Bytes'))).toEqual(
      Bytes.fromHex('0x61'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromString('~'), 'Bytes'))).toEqual(
      Bytes.fromHex('0x7e'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromBoolean(true), 'Bytes'))).toEqual(
      Bytes.fromHex('0x01'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromBoolean(false), 'Bytes'))).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromNumber(0), 'Bytes'))).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromNumber(69), 'Bytes'))).toEqual(
      Bytes.fromHex('0x45'),
    )
    expect(Rlp.decode(Rlp.encode(Hex.fromNumber(127), 'Bytes'))).toEqual(
      Bytes.fromHex('0x7f'),
    )
  })
})

describe('list', () => {
  test('no bytes', () => {
    // bytes -> bytes
    expect(Rlp.decode(Rlp.fromBytes([]))).toEqual([])
    // bytes -> hex
    expect(Rlp.toHex(Rlp.encode([]))).toEqual([])
    // hex -> hex
    expect(Rlp.decode(Rlp.fromHex([]))).toEqual([])
    // hex -> bytes
    expect(Rlp.toBytes(Rlp.fromHex([]))).toEqual([])
  })

  test('inner no bytes', () => {
    // bytes -> bytes
    expect(Rlp.decode(Rlp.fromBytes([[]]))).toEqual([[]])
    // bytes -> hex
    expect(Rlp.toHex(Rlp.fromBytes([[]]))).toEqual([[]])
    // hex -> hex
    expect(Rlp.toHex(Rlp.fromHex([[]]))).toEqual([[]])
    // hex -> bytes
    expect(Rlp.toBytes(Rlp.fromHex([[]]))).toEqual([[]])
  })

  describe('prefix < 0xf8', () => {
    test('bytes -> bytes', () => {
      expect(Rlp.decode(Rlp.fromBytes([Bytes.fromHex('0x00')]))).toEqual([
        Bytes.fromHex('0x00'),
      ])
      expect(Rlp.decode(Rlp.fromBytes([Bytes.fromHex('0x80')]))).toEqual([
        Bytes.fromHex('0x80'),
      ])
      expect(Rlp.decode(Rlp.fromBytes(generateList(14)))).toEqual(
        generateList(14),
      )
      expect(
        Rlp.decode(
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
      expect(Rlp.toHex(Rlp.encode(['0x00'], 'Bytes'))).toEqual(['0x00'])
      expect(Rlp.toHex(Rlp.encode(['0x80'], 'Bytes'))).toEqual(['0x80'])
      expect(Rlp.toHex(Rlp.encode(generateList(14), 'Bytes'))).toEqual(
        generateList(14).map((x) => Hex.fromBytes(x)),
      )
      expect(
        Rlp.toHex(
          Rlp.encode(
            [
              generateList(4),
              [generateList(8), [generateList(3), generateBytes(1)]],
            ],
            'Bytes',
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
      expect(Rlp.decode(Rlp.fromHex(['0x00']))).toEqual(['0x00'])
      expect(Rlp.decode(Rlp.fromHex(['0x80']))).toEqual(['0x80'])
      expect(
        Rlp.decode(Rlp.fromHex(generateList(14).map((x) => Hex.fromBytes(x)))),
      ).toEqual(generateList(14).map((x) => Hex.fromBytes(x)))
      expect(
        Rlp.decode(
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
      expect(Rlp.toBytes(Rlp.encode(['0x00'], 'Hex'))).toEqual([
        Bytes.fromHex('0x00'),
      ])
      expect(Rlp.toBytes(Rlp.encode(['0x80'], 'Hex'))).toEqual([
        Bytes.fromHex('0x80'),
      ])
      expect(Rlp.toBytes(Rlp.encode(generateList(14), 'Hex'))).toEqual(
        generateList(14),
      )
      expect(
        Rlp.toBytes(
          Rlp.encode(
            [
              generateList(4),
              [generateList(8), [generateList(3), generateBytes(1)]],
            ],
            'Hex',
          ),
        ),
      ).toEqual([
        generateList(4),
        [generateList(8), [generateList(3), generateBytes(1)]],
      ])
    })
  })

  test('prefix === 0xf9', () => {
    expect(Rlp.decode(Rlp.fromBytes(generateList(61)))).toEqual(
      generateList(61),
    )
    expect(Rlp.decode(Rlp.fromBytes(generateList(12_000)))).toEqual(
      generateList(12_000),
    )
  })

  test('prefix === 0xfa', () => {
    expect(Rlp.decode(Rlp.fromBytes(generateList(60_000)))).toEqual(
      generateList(60_000),
    )
  })
})

test('error: invalid hex value', () => {
  expect(() => Rlp.decode('0x010')).toThrowErrorMatchingInlineSnapshot(
    `
    [InvalidHexLengthError: Hex value \`"0x010"\` is an odd length (3 nibbles).

    It must be an even length.

    See: https://oxlib.sh/errors#invalidhexlengtherror]
  `,
  )
})
