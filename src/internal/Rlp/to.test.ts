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
    expect(Rlp.toHex(Rlp.from(Bytes.fromBoolean(true), { as: 'Hex' }))).toEqual(
      '0x01',
    )
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
    expect(Rlp.toBytes(Rlp.from(Hex.fromString('!'), { as: 'Bytes' }))).toEqual(
      Bytes.fromHex('0x21'),
    )
    expect(Rlp.toBytes(Rlp.from(Hex.fromString('a'), { as: 'Bytes' }))).toEqual(
      Bytes.fromHex('0x61'),
    )
    expect(Rlp.toBytes(Rlp.from(Hex.fromString('~'), { as: 'Bytes' }))).toEqual(
      Bytes.fromHex('0x7e'),
    )
    expect(
      Rlp.toBytes(Rlp.from(Hex.fromBoolean(true), { as: 'Bytes' })),
    ).toEqual(Bytes.fromHex('0x01'))
    expect(
      Rlp.toBytes(Rlp.from(Hex.fromBoolean(false), { as: 'Bytes' })),
    ).toEqual(Bytes.fromHex('0x00'))
    expect(Rlp.toBytes(Rlp.from(Hex.fromNumber(0), { as: 'Bytes' }))).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.toBytes(Rlp.from(Hex.fromNumber(69), { as: 'Bytes' }))).toEqual(
      Bytes.fromHex('0x45'),
    )
    expect(Rlp.toBytes(Rlp.from(Hex.fromNumber(127), { as: 'Bytes' }))).toEqual(
      Bytes.fromHex('0x7f'),
    )
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

    It must be an even length.

    See: https://oxlib.sh/errors#bytesinvalidhexlengtherror]
  `,
  )
})
