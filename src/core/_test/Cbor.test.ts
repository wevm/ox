import { Bytes, Cbor, Hash, Hex, PublicKey } from 'ox'
import { describe, expect, test } from 'vitest'

describe('encode', () => {
  test.each([
    ['0', [0], 0],
    ['1', [1], 1],
    ['10', [10], 10],
    ['23', [23], 23],
    ['24', [24, 24], 24],
    ['25', [24, 25], 25],
    ['100', [24, 100], 100],
    ['1000', [25, 3, 232], 1000],
    ['1000000', [26, 0, 15, 66, 64], 1000000],
    ['-1', [32], -1],
    ['-10', [41], -10],
    ['-24', [55], -24],
    ['-25', [56, 24], -25],
    ['-26', [56, 25], -26],
    ['-100', [56, 99], -100],
    ['-1000', [57, 3, 231], -1000],
    ['-1000000', [58, 0, 15, 66, 63], -1000000],
    ["''", [96], ''],
    ["'a'", [97, 97], 'a'],
    ["'IETF'", [100, 73, 69, 84, 70], 'IETF'],
    [`'"\\'`, [98, 34, 92], `"\\`],
    ["'\u00fc'", [98, 195, 188], '\u00fc'],
    ["'\u6c34'", [99, 230, 176, 180], '\u6c34'],
    ["'\ud800\udd51'", [100, 240, 144, 133, 145], '\ud800\udd51'],
    ['[]', [128], []],
    [
      "['a', {'b': 'c'}]",
      [130, 97, 97, 161, 97, 98, 97, 99],
      ['a', { b: 'c' }],
    ],
    ['[1,2,3]', [131, 1, 2, 3], [1, 2, 3]],
    [
      '[1, [2, 3], [4, 5]]',
      [131, 1, 130, 2, 3, 130, 4, 5],
      [1, [2, 3], [4, 5]],
    ],
    [
      '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]',
      [
        152, 25, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24, 24, 24, 25,
      ],
      [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    ],
    ['{}', [160], {}],
    [
      "{'a': 1, 'b': [2, 3]}",
      [162, 97, 97, 1, 97, 98, 130, 2, 3],
      { a: 1, b: [2, 3] },
    ],
    [
      '25-length object',
      [
        184, 26, 97, 48, 97, 97, 97, 49, 97, 97, 97, 50, 97, 97, 97, 51, 97, 97,
        97, 52, 97, 97, 97, 53, 97, 97, 97, 54, 97, 97, 97, 55, 97, 97, 97, 56,
        97, 97, 97, 57, 97, 97, 98, 49, 48, 97, 97, 98, 49, 49, 97, 97, 98, 49,
        50, 97, 97, 98, 49, 51, 97, 97, 98, 49, 52, 97, 97, 98, 49, 53, 97, 97,
        98, 49, 54, 97, 97, 98, 49, 55, 97, 97, 98, 49, 56, 97, 97, 98, 49, 57,
        97, 97, 98, 50, 48, 97, 97, 98, 50, 49, 97, 97, 98, 50, 50, 97, 97, 98,
        50, 51, 97, 97, 98, 50, 52, 97, 97, 98, 50, 53, 97, 97,
      ],
      {
        '0': 'a',
        '1': 'a',
        '2': 'a',
        '3': 'a',
        '4': 'a',
        '5': 'a',
        '6': 'a',
        '7': 'a',
        '8': 'a',
        '9': 'a',
        '10': 'a',
        '11': 'a',
        '12': 'a',
        '13': 'a',
        '14': 'a',
        '15': 'a',
        '16': 'a',
        '17': 'a',
        '18': 'a',
        '19': 'a',
        '20': 'a',
        '21': 'a',
        '22': 'a',
        '23': 'a',
        '24': 'a',
        '25': 'a',
      },
    ],
    [
      "{'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E'}",
      [
        165, 97, 97, 97, 65, 97, 98, 97, 66, 97, 99, 97, 67, 97, 100, 97, 68,
        97, 101, 97, 69,
      ],
      { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
    ],
    [
      "{ 'Fun': true, 'Amt': -2}",
      [162, 99, 70, 117, 110, 245, 99, 65, 109, 116, 33],
      { Fun: true, Amt: -2 },
    ],
    ['false', [244], false],
    ['true', [245], true],
    ['null', [246], null],
    ['undefined', [247], undefined],
    ['+Infinity', [250, 127, 128, 0, 0], Infinity],
    ['NaN', [250, 127, 192, 0, 0], NaN],
    ['-Infinity', [250, 255, 128, 0, 0], -Infinity],
    ['0.5', [250, 63, 0, 0, 0], 0.5],
    ['9007199254740994', [251, 67, 64, 0, 0, 0, 0, 0, 1], 9007199254740994],
    ['1.0e+300', [251, 126, 55, 228, 60, 136, 0, 117, 156], 1e300],
    ['-9007199254740994', [251, 195, 64, 0, 0, 0, 0, 0, 1], -9007199254740994],
    ["h''", [0x40], new Uint8Array()],
    ["h'01020304'", [68, 1, 2, 3, 4], new Uint8Array([1, 2, 3, 4])],
  ])('encode: %s', (_, output, input) => {
    expect(Cbor.encode(input)).toStrictEqual(Hex.from(output))
    expect(Cbor.encode(input, { as: 'Bytes' })).toStrictEqual(
      Bytes.from(output),
    )
  })

  test('large string (> 0xffff)', () => {
    const str = 'a'.repeat(0x10000)
    const encoded = Cbor.encode(str)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(str)
  })

  test('large array (> 0xff)', () => {
    const arr = Array.from({ length: 256 }, (_, i) => i)
    const encoded = Cbor.encode(arr)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(arr)
  })

  test('large array (> 0xffff)', () => {
    const arr = Array.from({ length: 0x10000 }, (_, i) => i % 256)
    const encoded = Cbor.encode(arr)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(arr)
  })

  test('large object (> 0xff)', () => {
    const obj: Record<string, number> = {}
    for (let i = 0; i < 256; i++) {
      obj[`key${i}`] = i
    }
    const encoded = Cbor.encode(obj)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(obj)
  })

  test('large byte string (> 0xff)', () => {
    const bytes = new Uint8Array(256).fill(42)
    const encoded = Cbor.encode(bytes)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(bytes)
  })

  test('large byte string (> 0xffff)', () => {
    const bytes = new Uint8Array(0x10000).fill(42)
    const encoded = Cbor.encode(bytes)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(bytes)
  })

  test('ArrayBuffer encoding', () => {
    const buffer = new ArrayBuffer(4)
    const view = new Uint8Array(buffer)
    view.set([1, 2, 3, 4])
    const encoded = Cbor.encode(buffer)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(new Uint8Array([1, 2, 3, 4]))
  })

  test('Uint16Array encoding', () => {
    const arr = new Uint16Array([1, 2, 3, 4])
    const encoded = Cbor.encode(arr)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(new Uint8Array([1, 0, 2, 0, 3, 0, 4, 0]))
  })

  test('Int8Array encoding', () => {
    const arr = new Int8Array([-1, -2, 3, 4])
    const encoded = Cbor.encode(arr)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(new Uint8Array([255, 254, 3, 4]))
  })

  test('Float32Array encoding', () => {
    const arr = new Float32Array([1.5, 2.5])
    const encoded = Cbor.encode(arr)
    const decoded = Cbor.decode(encoded) as Uint8Array
    expect(decoded).toBeInstanceOf(Uint8Array)
    expect(decoded.length).toBe(8)
  })

  test('DataView encoding', () => {
    const buffer = new ArrayBuffer(2)
    const view = new DataView(buffer)
    view.setUint8(0, 1)
    view.setUint8(1, 2)
    const encoded = Cbor.encode(view)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(new Uint8Array([1, 2]))
  })

  test('number too large throws', () => {
    const num = 0xfffffffffffff
    expect(() => Cbor.encode(num)).toThrow(Cbor.NumberTooLargeError)
  })

  test('negative number too large throws', () => {
    const num = -0xfffffffffffff
    expect(() => Cbor.encode(num)).toThrow(Cbor.NumberTooLargeError)
  })

  test('bigint throws', () => {
    expect(() => Cbor.encode(BigInt(42))).toThrow(Cbor.UnsupportedBigIntError)
  })

  test('unsupported type throws', () => {
    const symbol = Symbol('test')
    expect(() => Cbor.encode(symbol)).toThrow(Cbor.UnexpectedTokenError)
  })

  test('float64 encoding when value !== float32', () => {
    // A value that can't be represented exactly as float32
    const value = 1e100
    const encoded = Cbor.encode(value)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(value)
  })
})

describe('decode', () => {
  test.each([
    ['0', [0], 0],
    ['1', [1], 1],
    ['1', [1], 1],
    ['10', [10], 10],
    ['23', [23], 23],
    ['24', [24, 24], 24],
    ['25', [24, 25], 25],
    ['100', [24, 100], 100],
    ['1000', [25, 3, 232], 1000],
    ['1000000', [26, 0, 15, 66, 64], 1000000],
    ['-1', [32], -1],
    ['-10', [41], -10],
    ['-24', [55], -24],
    ['-25', [56, 24], -25],
    ['-26', [56, 25], -26],
    ['-100', [56, 99], -100],
    ['-1000', [57, 3, 231], -1000],
    ['-1000000', [58, 0, 15, 66, 63], -1000000],
    ["''", [96], ''],
    ["'a'", [97, 97], 'a'],
    ["'IETF'", [100, 73, 69, 84, 70], 'IETF'],
    [`'"\\'`, [98, 34, 92], `"\\`],
    ["'\u00fc'", [98, 195, 188], '\u00fc'],
    ["'\u6c34'", [99, 230, 176, 180], '\u6c34'],
    ["'\ud800\udd51'", [100, 240, 144, 133, 145], '\ud800\udd51'],
    [
      "'strea'+'ming'",
      [127, 101, 115, 116, 114, 101, 97, 100, 109, 105, 110, 103, 255],
      'streaming',
    ],
    [
      '255-length string',
      [
        120, 255, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100,
        101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101,
        97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97,
        98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98,
        99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99,
        100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100,
        101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101,
        97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97,
        98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98,
        99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99,
        100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100,
        101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101,
        97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97,
        98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98,
        99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99,
        100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 99, 100,
        101,
      ],
      'abcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcde',
    ],
    ['[]', [128], []],
    [
      "['a', {'b': 'c'}]",
      [130, 97, 97, 161, 97, 98, 97, 99],
      ['a', { b: 'c' }],
    ],
    [
      "['a, {_ 'b': 'c'}]",
      [130, 97, 97, 191, 97, 98, 97, 99, 255],
      ['a', { b: 'c' }],
    ],
    ['[1,2,3]', [131, 1, 2, 3], [1, 2, 3]],
    [
      '[1, [2, 3], [4, 5]]',
      [131, 1, 130, 2, 3, 130, 4, 5],
      [1, [2, 3], [4, 5]],
    ],
    [
      '[1, [2, 3], [_ 4, 5]]',
      [131, 1, 130, 2, 3, 159, 4, 5, 255],
      [1, [2, 3], [4, 5]],
    ],
    [
      '[1, [_ 2, 3], [4, 5]]',
      [131, 1, 159, 2, 3, 255, 130, 4, 5],
      [1, [2, 3], [4, 5]],
    ],
    [
      '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]',
      [
        152, 25, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24, 24, 24, 25,
      ],
      [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    ],
    [
      '[_ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]',
      [
        159, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 24, 24, 25, 255,
      ],
      [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    ],
    [
      '[_ 1, [2, 3], [4, 5]]',
      [159, 1, 130, 2, 3, 130, 4, 5, 255],
      [1, [2, 3], [4, 5]],
    ],
    [
      '[_ 1, [2, 3], [_ 4, 5]]',
      [159, 1, 130, 2, 3, 159, 4, 5, 255, 255],
      [1, [2, 3], [4, 5]],
    ],
    ['[_ ]', [159, 255], []],
    ['{}', [160], {}],
    [
      "{'a': 1, 'b': [2, 3]}",
      [162, 97, 97, 1, 97, 98, 130, 2, 3],
      { a: 1, b: [2, 3] },
    ],
    [
      '25-length object',
      [
        184, 26, 97, 48, 97, 97, 97, 49, 97, 97, 97, 50, 97, 97, 97, 51, 97, 97,
        97, 52, 97, 97, 97, 53, 97, 97, 97, 54, 97, 97, 97, 55, 97, 97, 97, 56,
        97, 97, 97, 57, 97, 97, 98, 49, 48, 97, 97, 98, 49, 49, 97, 97, 98, 49,
        50, 97, 97, 98, 49, 51, 97, 97, 98, 49, 52, 97, 97, 98, 49, 53, 97, 97,
        98, 49, 54, 97, 97, 98, 49, 55, 97, 97, 98, 49, 56, 97, 97, 98, 49, 57,
        97, 97, 98, 50, 48, 97, 97, 98, 50, 49, 97, 97, 98, 50, 50, 97, 97, 98,
        50, 51, 97, 97, 98, 50, 52, 97, 97, 98, 50, 53, 97, 97,
      ],
      {
        '0': 'a',
        '1': 'a',
        '2': 'a',
        '3': 'a',
        '4': 'a',
        '5': 'a',
        '6': 'a',
        '7': 'a',
        '8': 'a',
        '9': 'a',
        '10': 'a',
        '11': 'a',
        '12': 'a',
        '13': 'a',
        '14': 'a',
        '15': 'a',
        '16': 'a',
        '17': 'a',
        '18': 'a',
        '19': 'a',
        '20': 'a',
        '21': 'a',
        '22': 'a',
        '23': 'a',
        '24': 'a',
        '25': 'a',
      },
    ],
    [
      "{'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E'}",
      [
        165, 97, 97, 97, 65, 97, 98, 97, 66, 97, 99, 97, 67, 97, 100, 97, 68,
        97, 101, 97, 69,
      ],
      { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
    ],
    [
      "{_ 'a': 1, 'b': [_ 2, 3]}",
      [191, 97, 97, 1, 97, 98, 159, 2, 3, 255, 255],
      { a: 1, b: [2, 3] },
    ],
    [
      "{_ 'Fun': true, 'Amt': -2}",
      [191, 99, 70, 117, 110, 245, 99, 65, 109, 116, 33, 255],
      { Fun: true, Amt: -2 },
    ],
    ['false', [244], false],
    ['true', [245], true],
    ['null', [246], null],
    ['undefined', [247], undefined],
    ['Simple value 255', [248, 255], undefined],
    ['+Infinity', [250, 127, 128, 0, 0], Infinity],
    ['NaN', [250, 127, 192, 0, 0], NaN],
    ['-Infinity', [250, 255, 128, 0, 0], -Infinity],
    ['0.5', [250, 63, 0, 0, 0], 0.5],
    ['9007199254740994', [251, 67, 64, 0, 0, 0, 0, 0, 1], 9007199254740994],
    ['1.0e+300', [251, 126, 55, 228, 60, 136, 0, 117, 156], 1e300],
    ['-9007199254740994', [251, 195, 64, 0, 0, 0, 0, 0, 1], -9007199254740994],
    ["h''", [0x40], new Uint8Array()],
    ["h'01020304'", [68, 1, 2, 3, 4], new Uint8Array([1, 2, 3, 4])],
    [
      "(_ h'0102', h'030405')",
      [95, 66, 1, 2, 67, 3, 4, 5, 255],
      new Uint8Array([1, 2, 3, 4, 5]),
    ],
  ])('decode: %s', (_, input, output) => {
    const decoded = Cbor.decode(Hex.from(input))
    expect(decoded).toStrictEqual(output)
  })

  test('from Bytes', () => {
    const bytes = Bytes.from([0x18, 0x2a])
    const decoded = Cbor.decode(bytes)
    expect(decoded).toBe(42)
  })

  test('invalid hex length throws', () => {
    expect(() => Cbor.decode('0x123')).toThrow()
  })

  test('large string (> 0xffff)', () => {
    const str = 'a'.repeat(0x10000)
    const encoded = Cbor.encode(str)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(str)
  })

  test('large array (> 0xffff)', () => {
    const arr = Array.from({ length: 0x10000 }, (_, i) => i % 256)
    const encoded = Cbor.encode(arr)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(arr)
  })

  test('large byte string (> 0xffff)', () => {
    const bytes = new Uint8Array(0x10000).fill(42)
    const encoded = Cbor.encode(bytes)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(bytes)
  })

  test('float16: zero', () => {
    // Float16 zero: 0x0000
    const encoded = Hex.from([0xf9, 0x00, 0x00])
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(0)
  })

  test('float16: negative zero', () => {
    // Float16 negative zero: 0x8000
    const encoded = Hex.from([0xf9, 0x80, 0x00])
    const decoded = Cbor.decode(encoded)
    expect(Object.is(decoded, -0)).toBe(true)
  })

  test('float16: infinity', () => {
    // Float16 infinity: 0x7c00
    const encoded = Hex.from([0xf9, 0x7c, 0x00])
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(Infinity)
  })

  test('float16: negative infinity', () => {
    // Float16 negative infinity: 0xfc00
    const encoded = Hex.from([0xf9, 0xfc, 0x00])
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(-Infinity)
  })

  test('float16: NaN', () => {
    // Float16 NaN: 0x7e00
    const encoded = Hex.from([0xf9, 0x7e, 0x00])
    const decoded = Cbor.decode(encoded)
    expect(Number.isNaN(decoded)).toBe(true)
  })

  test('float16: subnormal', () => {
    // Float16 smallest subnormal: 0x0001
    const encoded = Hex.from([0xf9, 0x00, 0x01])
    const decoded = Cbor.decode(encoded)
    // Smallest positive subnormal float16 value
    expect(decoded).toBeGreaterThan(0)
    expect(decoded).toBeLessThan(1e-7)
  })

  test('float16: normal number', () => {
    // Float16 1.0: 0x3c00
    const encoded = Hex.from([0xf9, 0x3c, 0x00])
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(1)
  })

  test('invalid major type throws', () => {
    // Actually, let's create a truly invalid major type
    const invalid = new Uint8Array([0xe0]) // 11100000 = major type 7, but invalid additional info
    expect(() => Cbor.decode(invalid)).toThrow()
  })

  test('unsupported 64-bit integer throws', () => {
    // Additional info 27 = 64-bit integer
    const encoded = Hex.from([
      0x1b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ])
    expect(() => Cbor.decode(encoded)).toThrow(
      Cbor.Unsupported64BitIntegerError,
    )
  })

  test('unsupported tag throws', () => {
    // Major type 6 = tag
    const encoded = Hex.from([0xc0, 0x01])
    expect(() => Cbor.decode(encoded)).toThrow(Cbor.UnsupportedTagError)
  })

  test('invalid additional info throws', () => {
    // Additional info 28-30 are invalid
    const encoded = Hex.from([0x1c]) // 00011100 = major type 0, additional info 28
    expect(() => Cbor.decode(encoded)).toThrow(Cbor.InvalidAdditionalInfoError)
  })

  test('map with integer key converts to string', () => {
    // Map with integer key (converted to string for COSE_Key compatibility)
    const encoded = Hex.from([0xa1, 0x01, 0x02]) // {1: 2}
    const decoded = Cbor.decode<Record<string, number>>(encoded)
    expect(decoded).toEqual({ '1': 2 })
  })

  test('invalid simple value throws', () => {
    // Simple value < 32 (reserved)
    const encoded = Hex.from([0xf8, 0x10]) // Simple value 16
    expect(() => Cbor.decode(encoded)).toThrow(Cbor.InvalidSimpleValueError)
  })

  test('invalid indefinite length byte string chunk throws', () => {
    // Indefinite-length byte string with non-byte-string chunk
    const encoded = Hex.from([0x5f, 0x61, 0x61, 0xff]) // (_ 'a')
    expect(() => Cbor.decode(encoded)).toThrow(
      Cbor.InvalidIndefiniteLengthChunkError,
    )
  })

  test('invalid indefinite length text string chunk throws', () => {
    // Indefinite-length text string with non-text-string chunk
    const encoded = Hex.from([0x7f, 0x40, 0xff]) // (_ h'')
    expect(() => Cbor.decode(encoded)).toThrow(
      Cbor.InvalidIndefiniteLengthChunkError,
    )
  })

  test('readLength: additional info < 24', () => {
    const encoded = Hex.from([0x15]) // 21 directly encoded
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(21)
  })

  test('readLength: additional info 24 (uint8)', () => {
    const encoded = Hex.from([0x18, 0xff]) // 255
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(255)
  })

  test('readLength: additional info 25 (uint16)', () => {
    const encoded = Hex.from([0x19, 0x01, 0x00]) // 256
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(256)
  })

  test('readLength: additional info 26 (uint32)', () => {
    const encoded = Hex.from([0x1a, 0x00, 0x01, 0x00, 0x00]) // 65536
    const decoded = Cbor.decode(encoded)
    expect(decoded).toBe(65536)
  })
})

describe('roundtrip', () => {
  test.each([
    ['number: 0', 0],
    ['number: 42', 42],
    ['number: 1000', 1000],
    ['number: -1', -1],
    ['number: -100', -100],
    ['float: 0.5', 0.5],
    ['float: Infinity', Infinity],
    ['float: -Infinity', -Infinity],
    ['string: empty', ''],
    ['string: hello', 'hello'],
    ['string: unicode', '\u6c34'],
    ['boolean: true', true],
    ['boolean: false', false],
    ['null', null],
    ['undefined', undefined],
    ['array: empty', []],
    ['array: numbers', [1, 2, 3]],
    ['array: nested', [1, [2, 3], [4, 5]]],
    ['object: empty', {}],
    ['object: simple', { a: 1, b: 2 }],
    ['object: nested', { a: 1, b: [2, 3] }],
    ['complex', { a: 'hello', b: [1, 2, { c: true }], d: null }],
  ])('roundtrip: %s', (_, value) => {
    const encoded = Cbor.encode(value)
    const decoded = Cbor.decode(encoded)
    if (typeof value === 'number' && Number.isNaN(value)) {
      expect(Number.isNaN(decoded)).toBe(true)
    } else {
      expect(decoded).toStrictEqual(value)
    }
  })

  test('roundtrip: byte string', () => {
    const value = new Uint8Array([1, 2, 3, 4])
    const encoded = Cbor.encode(value)
    const decoded = Cbor.decode(encoded)
    expect(decoded).toStrictEqual(value)
  })
})

describe('webauthn', () => {
  const rpId = 'localhost'
  const attestationObject =
    '0xa363666d74646e6f6e656761747453746d74a0686175746844617461589849960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97635d00000000fbfc3007154e4ecc8c0b6e020557d7bd0014f55a2aef110f9c55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0f606fcb54ce453b8ae09d0661303dd4ad8d4063be212872258202093aff8b065c247c742e6833937ba987fb0f871e61fcfc6763fd9144611210f'
  const publicKey = PublicKey.from({
    x: Hex.fromNumber(
      108058905462353399599412887269393158541451912165746768801221323097156211577479n,
      { size: 32 },
    ),
    y: Hex.fromNumber(
      14734952183441233246695696377579450501147029832688498617254314309528960704783n,
      { size: 32 },
    ),
  })

  test('behavior: verify authData', () => {
    const decoded = Cbor.decode<{ fmt: string; authData: Bytes.Bytes }>(
      attestationObject,
    )
    const authDataBytes = decoded.authData
    const authData = Bytes.toHex(authDataBytes)

    // Extract rpIdHash (bytes 0-31)
    const rpIdHash_expected = Hex.slice(authData, 0, 32)
    const rpIdHash_actual = Hash.sha256(Hex.fromString(rpId))
    expect(rpIdHash_actual).toBe(rpIdHash_expected)

    // Extract flags (byte 32)
    const flags = authDataBytes[32]!
    expect(flags & 0x01).toBe(0x01) // UP bit should be set
    expect(flags & 0x40).toBe(0x40) // AT bit should be set (attested credential data present)

    // Extract signCount (bytes 33-36)
    const signCount = authDataBytes.slice(33, 37)
    expect(signCount).toStrictEqual(Bytes.from([0, 0, 0, 0]))

    // Extract attested credential data (when AT bit is set)
    // Structure: aaguid (16 bytes) + credentialIdLength (2 bytes) + credentialId + credentialPublicKey
    const aaguid = authDataBytes.slice(37, 53)
    expect(aaguid.length).toBe(16)

    const credentialIdLength = (authDataBytes[53]! << 8) | authDataBytes[54]!
    const credentialId = authDataBytes.slice(55, 55 + credentialIdLength)
    expect(credentialId.length).toBe(credentialIdLength)

    // Extract credentialPublicKey (starts after credentialId)
    // The credentialPublicKey is CBOR-encoded as a COSE_Key map
    const credentialPublicKeyStart = 55 + credentialIdLength
    const credentialPublicKeyCbor = authDataBytes.slice(
      credentialPublicKeyStart,
    )
    const credentialPublicKey = Cbor.decode<{
      1: number // kty
      3: number // alg
      '-1': number // crv
      '-2': Bytes.Bytes // x
      '-3': Bytes.Bytes // y
    }>(credentialPublicKeyCbor)

    expect(credentialPublicKey['3']).toBe(-7)
    expect(credentialPublicKey['-1']).toBe(1)

    const x = Bytes.toHex(credentialPublicKey['-2'], { size: 32 })
    const y = Bytes.toHex(credentialPublicKey['-3'], { size: 32 })
    expect(
      PublicKey.from({
        x,
        y,
      }),
    ).toStrictEqual(publicKey)
  })
})
