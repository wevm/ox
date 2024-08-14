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
  // bytes -> bytes
  expect(Rlp.fromBytes(Bytes.fromHex('0x'))).toEqual(Bytes.fromHex('0x80'))
  // bytes -> hex
  expect(Rlp.encode(Bytes.fromHex('0x'), 'hex')).toEqual('0x80')
  // hex -> hex
  expect(Rlp.fromHex('0x')).toEqual('0x80')
  // hex -> bytes
  expect(Rlp.encode('0x', 'bytes')).toEqual(Bytes.fromHex('0x80'))
})

describe('prefix < 0x80', () => {
  test('bytes -> bytes', () => {
    expect(Rlp.fromBytes(Bytes.fromHex('0x00'))).toEqual(Bytes.fromHex('0x00'))
    expect(Rlp.fromBytes(Bytes.fromHex('0x01'))).toEqual(Bytes.fromHex('0x01'))
    expect(Rlp.fromBytes(Bytes.fromHex('0x42'))).toEqual(Bytes.fromHex('0x42'))
    expect(Rlp.fromBytes(Bytes.fromHex('0x7f'))).toEqual(Bytes.fromHex('0x7f'))

    expect(Rlp.fromBytes(Bytes.fromString('!'))).toEqual(Bytes.fromHex('0x21'))
    expect(Rlp.fromBytes(Bytes.fromString('a'))).toEqual(Bytes.fromHex('0x61'))
    expect(Rlp.fromBytes(Bytes.fromString('~'))).toEqual(Bytes.fromHex('0x7e'))

    expect(Rlp.fromBytes(Bytes.fromBool(true))).toEqual(Bytes.fromHex('0x01'))
    expect(Rlp.fromBytes(Bytes.fromBool(false))).toEqual(Bytes.fromHex('0x00'))

    expect(Rlp.fromBytes(Bytes.fromNumber(0))).toEqual(Bytes.fromHex('0x00'))
    expect(Rlp.fromBytes(Bytes.fromNumber(69))).toEqual(Bytes.fromHex('0x45'))
    expect(Rlp.fromBytes(Bytes.fromNumber(127))).toEqual(Bytes.fromHex('0x7f'))
  })

  test('bytes -> hex', () => {
    expect(Rlp.encode(Bytes.fromHex('0x00'), 'hex')).toEqual('0x00')
    expect(Rlp.encode(Bytes.fromHex('0x01'), 'hex')).toEqual('0x01')
    expect(Rlp.encode(Bytes.fromHex('0x42'), 'hex')).toEqual('0x42')
    expect(Rlp.encode(Bytes.fromHex('0x7f'), 'hex')).toEqual('0x7f')

    expect(Rlp.encode(Bytes.fromString('!'), 'hex')).toEqual('0x21')
    expect(Rlp.encode(Bytes.fromString('a'), 'hex')).toEqual('0x61')
    expect(Rlp.encode(Bytes.fromString('~'), 'hex')).toEqual('0x7e')

    expect(Rlp.encode(Bytes.fromBool(true), 'hex')).toEqual('0x01')
    expect(Rlp.encode(Bytes.fromBool(false), 'hex')).toEqual('0x00')

    expect(Rlp.encode(Bytes.fromNumber(0), 'hex')).toEqual('0x00')
    expect(Rlp.encode(Bytes.fromNumber(69), 'hex')).toEqual('0x45')
    expect(Rlp.encode(Bytes.fromNumber(127), 'hex')).toEqual('0x7f')
  })

  test('hex -> hex', () => {
    expect(Rlp.fromHex('0x00')).toEqual('0x00')
    expect(Rlp.fromHex('0x01')).toEqual('0x01')
    expect(Rlp.fromHex('0x42')).toEqual('0x42')
    expect(Rlp.fromHex('0x7f')).toEqual('0x7f')

    expect(Rlp.fromHex(Hex.fromString('!'))).toEqual('0x21')
    expect(Rlp.fromHex(Hex.fromString('a'))).toEqual('0x61')
    expect(Rlp.fromHex(Hex.fromString('~'))).toEqual('0x7e')

    expect(Rlp.fromHex(Hex.fromBool(true))).toEqual('0x01')
    expect(Rlp.fromHex(Hex.fromBool(false))).toEqual('0x00')

    expect(Rlp.fromHex(Hex.fromNumber(0))).toEqual('0x00')
    expect(Rlp.fromHex(Hex.fromNumber(69))).toEqual('0x45')
    expect(Rlp.fromHex(Hex.fromNumber(127))).toEqual('0x7f')
  })

  test('hex -> bytes', () => {
    expect(Rlp.encode('0x00', 'bytes')).toEqual(Bytes.fromHex('0x00'))
    expect(Rlp.encode('0x01', 'bytes')).toEqual(Bytes.fromHex('0x01'))
    expect(Rlp.encode('0x42', 'bytes')).toEqual(Bytes.fromHex('0x42'))
    expect(Rlp.encode('0x7f', 'bytes')).toEqual(Bytes.fromHex('0x7f'))

    expect(Rlp.encode(Hex.fromString('!'), 'bytes')).toEqual(
      Bytes.fromHex('0x21'),
    )
    expect(Rlp.encode(Hex.fromString('a'), 'bytes')).toEqual(
      Bytes.fromHex('0x61'),
    )
    expect(Rlp.encode(Hex.fromString('~'), 'bytes')).toEqual(
      Bytes.fromHex('0x7e'),
    )

    expect(Rlp.encode(Hex.fromBool(true), 'bytes')).toEqual(
      Bytes.fromHex('0x01'),
    )
    expect(Rlp.encode(Hex.fromBool(false), 'bytes')).toEqual(
      Bytes.fromHex('0x00'),
    )

    expect(Rlp.encode(Hex.fromNumber(0), 'bytes')).toEqual(
      Bytes.fromHex('0x00'),
    )
    expect(Rlp.encode(Hex.fromNumber(69), 'bytes')).toEqual(
      Bytes.fromHex('0x45'),
    )
    expect(Rlp.encode(Hex.fromNumber(127), 'bytes')).toEqual(
      Bytes.fromHex('0x7f'),
    )
  })
})

describe('prefix < 0xb7 (single byte)', () => {
  test('bytes -> bytes', () => {
    expect(Rlp.fromBytes(Bytes.fromHex('0x80'))).toEqual(
      Bytes.fromHex('0x8180'),
    )
    expect(Rlp.fromBytes(Bytes.fromHex('0xa4'))).toEqual(
      Bytes.fromHex('0x81a4'),
    )
    expect(Rlp.fromBytes(Bytes.fromHex('0xff'))).toEqual(
      Bytes.fromHex('0x81ff'),
    )

    expect(Rlp.fromBytes(Bytes.fromNumber(128))).toEqual(
      Bytes.fromHex('0x8180'),
    )
    expect(Rlp.fromBytes(Bytes.fromNumber(255))).toEqual(
      Bytes.fromHex('0x81ff'),
    )
  })

  test('bytes -> hex', () => {
    expect(Rlp.encode(Bytes.fromHex('0x80'), 'hex')).toEqual('0x8180')
    expect(Rlp.encode(Bytes.fromHex('0xa4'), 'hex')).toEqual('0x81a4')
    expect(Rlp.encode(Bytes.fromHex('0xff'), 'hex')).toEqual('0x81ff')

    expect(Rlp.encode(Bytes.fromNumber(128), 'hex')).toEqual('0x8180')
    expect(Rlp.encode(Bytes.fromNumber(255), 'hex')).toEqual('0x81ff')
  })

  test('hex -> hex', () => {
    expect(Rlp.fromHex('0x80', 'hex')).toEqual('0x8180')
    expect(Rlp.fromHex('0xa4', 'hex')).toEqual('0x81a4')
    expect(Rlp.fromHex('0xff', 'hex')).toEqual('0x81ff')

    expect(Rlp.fromHex(Hex.fromNumber(128), 'hex')).toEqual('0x8180')
    expect(Rlp.fromHex(Hex.fromNumber(255), 'hex')).toEqual('0x81ff')
  })

  test('hex -> bytes', () => {
    expect(Rlp.encode('0x80', 'bytes')).toEqual(Bytes.fromHex('0x8180'))
    expect(Rlp.encode('0xa4', 'bytes')).toEqual(Bytes.fromHex('0x81a4'))
    expect(Rlp.encode('0xff', 'bytes')).toEqual(Bytes.fromHex('0x81ff'))

    expect(Rlp.encode(Hex.fromNumber(128), 'bytes')).toEqual(
      Bytes.fromHex('0x8180'),
    )
    expect(Rlp.encode(Hex.fromNumber(255), 'bytes')).toEqual(
      Bytes.fromHex('0x81ff'),
    )
  })
})

describe('prefix < 0xb7', () => {
  test('bytes -> bytes', () => {
    expect(Rlp.fromBytes(generateBytes(2))).toEqual(
      Uint8Array.from([130, ...generateBytes(2)]),
    )
    expect(Rlp.fromBytes(generateBytes(55))).toEqual(
      Uint8Array.from([183, ...generateBytes(55)]),
    )
  })

  test('bytes -> hex', () => {
    expect(Rlp.encode(generateBytes(2), 'hex')).toEqual(
      Hex.fromBytes(Uint8Array.from([130, ...generateBytes(2)])),
    )
    expect(Rlp.encode(generateBytes(55), 'hex')).toEqual(
      Hex.fromBytes(Uint8Array.from([183, ...generateBytes(55)])),
    )
  })

  test('hex -> hex', () => {
    expect(Rlp.fromHex(Hex.fromBytes(generateBytes(2)))).toEqual(
      Hex.fromBytes(Uint8Array.from([130, ...generateBytes(2)])),
    )
    expect(Rlp.fromHex(Hex.fromBytes(generateBytes(55)))).toEqual(
      Hex.fromBytes(Uint8Array.from([183, ...generateBytes(55)])),
    )
  })

  test('hex -> bytes', () => {
    expect(Rlp.encode(Hex.fromBytes(generateBytes(2)), 'bytes')).toEqual(
      Uint8Array.from([130, ...generateBytes(2)]),
    )
    expect(Rlp.encode(Hex.fromBytes(generateBytes(55)), 'bytes')).toEqual(
      Uint8Array.from([183, ...generateBytes(55)]),
    )
  })
})

describe('prefix === 0xb8', () => {
  test('bytes -> bytes', () => {
    expect(Rlp.fromBytes(generateBytes(56))).toEqual(
      Uint8Array.from([184, 56, ...generateBytes(56)]),
    )
    expect(Rlp.fromBytes(generateBytes(255))).toEqual(
      Uint8Array.from([184, 255, ...generateBytes(255)]),
    )
  })
})

describe('prefix === 0xb9', () => {
  test('bytes -> bytes', () => {
    expect(Rlp.fromBytes(generateBytes(256))).toEqual(
      Uint8Array.from([185, 1, 0, ...generateBytes(256)]),
    )
    expect(Rlp.fromBytes(generateBytes(65_535))).toEqual(
      Uint8Array.from([185, 255, 255, ...generateBytes(65_535)]),
    )
  })
})

describe('prefix === 0xba', () => {
  test('bytes -> bytes', () => {
    const bytes_1 = generateBytes(65_536)
    expect(Rlp.fromBytes(bytes_1)).toEqual(
      Uint8Array.from([186, 1, 0, 0, ...bytes_1]),
    )

    const bytes_2 = generateBytes(16_777_215)
    expect(Rlp.fromBytes(bytes_2)).toEqual(
      Uint8Array.from([186, 255, 255, 255, ...bytes_2]),
    )
  })
})

describe('prefix === 0xbb', () => {
  test('bytes -> bytes', () => {
    const bytes_1 = generateBytes(16_777_216)
    expect(Rlp.fromBytes(bytes_1)).toEqual(
      Uint8Array.from([187, 1, 0, 0, 0, ...bytes_1]),
    )
  })
})

describe('list', () => {
  test('no bytes', () => {
    // bytes -> bytes
    expect(Hex.fromBytes(Rlp.fromBytes([]))).toMatchInlineSnapshot('"0xc0"')
    // bytes -> hex
    expect(Rlp.encode([], 'hex')).toMatchInlineSnapshot('"0xc0"')
    // hex -> hex
    expect(Rlp.fromHex([])).toMatchInlineSnapshot('"0xc0"')
    // hex -> bytes
    expect(Hex.fromBytes(Rlp.fromHex([], 'bytes'))).toMatchInlineSnapshot(
      '"0xc0"',
    )
  })

  test('inner no bytes', () => {
    // bytes -> bytes
    expect(Hex.fromBytes(Rlp.fromBytes([[]]))).toMatchInlineSnapshot('"0xc1c0"')
    // bytes -> hex
    expect(Rlp.encode([[]], 'hex')).toMatchInlineSnapshot('"0xc1c0"')
    // hex -> hex
    expect(Rlp.fromHex([[]])).toMatchInlineSnapshot('"0xc1c0"')
    // hex -> bytes
    expect(Hex.fromBytes(Rlp.fromHex([[]], 'bytes'))).toMatchInlineSnapshot(
      '"0xc1c0"',
    )
  })

  describe('prefix < 0xf8', () => {
    test('bytes -> bytes', () => {
      expect(
        Hex.fromBytes(Rlp.fromBytes([Bytes.fromHex('0x00')])),
      ).toMatchInlineSnapshot('"0xc100"')
      expect(
        Hex.fromBytes(Rlp.fromBytes([Bytes.fromHex('0x80')])),
      ).toMatchInlineSnapshot('"0xc28180"')
      expect(
        Hex.fromBytes(Rlp.fromBytes(generateList(14))),
      ).toMatchInlineSnapshot(
        '"0xf780008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304"',
      )
      expect(
        Hex.fromBytes(
          Rlp.fromBytes([
            generateList(4),
            [generateList(8), [generateList(3), generateBytes(1)]],
          ]),
        ),
      ).toMatchInlineSnapshot(
        '"0xf7c9800082000183000102ece38000820001830001028400010203850001020304860001020304058700010203040506c7c5800082000100"',
      )
    })

    test('bytes -> hex', () => {
      expect(Rlp.encode([Bytes.fromHex('0x00')], 'hex')).toMatchInlineSnapshot(
        '"0xc100"',
      )
      expect(Rlp.encode([Bytes.fromHex('0x80')], 'hex')).toMatchInlineSnapshot(
        '"0xc28180"',
      )
      expect(Rlp.encode(generateList(14), 'hex')).toMatchInlineSnapshot(
        '"0xf780008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304"',
      )
      expect(
        Rlp.encode(
          [
            generateList(4),
            [generateList(8), [generateList(3), generateBytes(1)]],
          ],
          'hex',
        ),
      ).toMatchInlineSnapshot(
        '"0xf7c9800082000183000102ece38000820001830001028400010203850001020304860001020304058700010203040506c7c5800082000100"',
      )
    })

    test('hex -> hex', () => {
      expect(Rlp.fromHex(['0x00'])).toMatchInlineSnapshot('"0xc100"')
      expect(Rlp.fromHex(['0x80'])).toMatchInlineSnapshot('"0xc28180"')
      expect(
        Rlp.fromHex(generateList(14).map((x) => Hex.fromBytes(x))),
      ).toMatchInlineSnapshot(
        '"0xf780008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304"',
      )
      expect(
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
      ).toMatchInlineSnapshot(
        '"0xf7c9800082000183000102ece38000820001830001028400010203850001020304860001020304058700010203040506c7c5800082000100"',
      )
    })

    test('hex -> bytes', () => {
      expect(
        Hex.fromBytes(Rlp.encode(['0x00'], 'bytes')),
      ).toMatchInlineSnapshot('"0xc100"')
      expect(
        Hex.fromBytes(Rlp.encode(['0x80'], 'bytes')),
      ).toMatchInlineSnapshot('"0xc28180"')
      expect(
        Hex.fromBytes(
          Rlp.encode(
            generateList(14).map((x) => Hex.fromBytes(x)),
            'bytes',
          ),
        ),
      ).toMatchInlineSnapshot(
        '"0xf780008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304"',
      )
      expect(
        Hex.fromBytes(
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
            'bytes',
          ),
        ),
      ).toMatchInlineSnapshot(
        '"0xf7c9800082000183000102ece38000820001830001028400010203850001020304860001020304058700010203040506c7c5800082000100"',
      )
    })
  })

  test('prefix === 0xf8', () => {
    expect(
      Hex.fromBytes(Rlp.fromBytes(generateList(15))),
    ).toMatchInlineSnapshot(
      '"0xf83e8000820001830001028400010203850001020304860001020304058700010203040506800082000183000102840001020385000102030486000102030405"',
    )
    expect(
      Hex.fromBytes(Rlp.fromBytes(generateList(60))),
    ).toMatchInlineSnapshot(
      '"0xf8fe8000820001830001028400010203850001020304860001020304058700010203040506800082000183000102840001020385000102030486000102030405870001020304050680008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304860001020304058700010203040506800082000183000102840001020385000102030486000102030405870001020304050680008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304860001020304058700010203040506800082000183000102"',
    )
    expect(
      Hex.fromBytes(
        Rlp.fromBytes([
          generateList(4),
          [generateList(8), [generateList(3), generateBytes(1)]],
          [
            generateList(10),
            [
              generateList(5),
              generateBytes(2),
              [generateList(10), [generateList(20)]],
            ],
          ],
        ]),
      ),
    ).toMatchInlineSnapshot(
      '"0xf8eec9800082000183000102ece38000820001830001028400010203850001020304860001020304058700010203040506c7c5800082000100f8b5e580008200018300010284000102038500010203048600010203040587000102030405068000f88dce8000820001830001028400010203820001f879e580008200018300010284000102038500010203048600010203040587000102030405068000f851f84f80008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304860001020304058700010203040506800082000183000102"',
    )
  })

  test('prefix === 0xf9', () => {
    expect(
      Hex.fromBytes(Rlp.fromBytes(generateList(61))),
    ).toMatchInlineSnapshot(
      '"0xf9010380008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304860001020304058700010203040506800082000183000102840001020385000102030486000102030405870001020304050680008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203850001020304860001020304058700010203040506800082000183000102840001020385000102030486000102030405870001020304050680008200018300010284000102038500010203048600010203040587000102030405068000820001830001028400010203"',
    )
    expect(Hex.fromBytes(Rlp.fromBytes(generateList(12_000)))).toMatchSnapshot()
  })

  test('prefix === 0xfa', () => {
    expect(
      Bytes.bytesToHex(Rlp.bytesToRlp(generateList(60_000))),
    ).toMatchSnapshot()
  })

  // This test works, but it's really slow (understandably).
  test.skip('prefix === 0xfb', () => {
    expect(
      Hex.fromBytes(Rlp.fromBytes(generateList(10_000_000))),
    ).toMatchSnapshot()
  })
})

test('behavior: inferred `to`', () => {
  {
    // hex -> hex
    const rlp = Rlp.encode(Hex.from(generateBytes(256)))
    expect(rlp).toEqual(
      Hex.from(Uint8Array.from([185, 1, 0, ...generateBytes(256)])),
    )
  }

  {
    // hex (list) -> hex
    const rlp = Rlp.encode([Hex.from(generateBytes(256))])
    expect(rlp).toEqual(
      Hex.from(Uint8Array.from([249, 1, 3, 185, 1, 0, ...generateBytes(256)])),
    )
  }

  {
    // bytes -> bytes
    const rlp = Rlp.encode(generateBytes(256))
    expect(rlp).toEqual(Uint8Array.from([185, 1, 0, ...generateBytes(256)]))
  }

  {
    // bytes (list) -> bytes
    const rlp = Rlp.encode([generateBytes(256)])
    expect(rlp).toEqual(
      Uint8Array.from([249, 1, 3, 185, 1, 0, ...generateBytes(256)]),
    )
  }
})
