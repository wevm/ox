import { Base58 } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromBytes', () => {
  test('default', () => {
    expect(
      Base58.fromBytes(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toBe('2NEpo7TZRRrLZSi2U')
  })
})

describe('fromHex', () => {
  test('default', () => {
    expect(Base58.fromHex('0x00000000287fb4cd')).toBe('1111233QC4')
  })
})

describe('fromString', () => {
  test('default', () => {
    expect(Base58.fromString('Hello World!')).toBe('2NEpo7TZRRrLZSi2U')
    expect(
      Base58.fromString('The quick brown fox jumps over the lazy dog.'),
    ).toBe('USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z')
  })
})

describe('toBytes', () => {
  test('default', () => {
    expect(Base58.toBytes('2NEpo7TZRRrLZSi2U')).toMatchInlineSnapshot(`
      Uint8Array [
        72,
        101,
        108,
        108,
        111,
        32,
        87,
        111,
        114,
        108,
        100,
        33,
      ]
    `)
  })
})

describe('toHex', () => {
  test('default', () => {
    expect(Base58.toHex('233QC4')).toBe('0x287fb4cd')
    expect(Base58.toHex('11233QC4')).toBe('0x0000287fb4cd')
    expect(() => Base58.toHex('233QC4I')).toThrowErrorMatchingInlineSnapshot(
      `[Base58.InvalidCharacterError: Invalid Base58 character: "I".]`,
    )
  })
})

describe('toString', () => {
  test('default', () => {
    expect(Base58.toString('2NEpo7TZRRrLZSi2U')).toBe('Hello World!')
    expect(
      Base58.toString(
        'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z',
      ),
    ).toBe('The quick brown fox jumps over the lazy dog.')
  })
})

describe('encode', () => {
  test('bytes input', () => {
    const bytes = new Uint8Array([
      72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
    ])
    expect(Base58.encode(bytes)).toBe('2NEpo7TZRRrLZSi2U')
  })

  test('hex input', () => {
    expect(Base58.encode('0x48656c6c6f20576f726c6421')).toBe(
      '2NEpo7TZRRrLZSi2U',
    )
  })

  test('utf-8 string input', () => {
    expect(Base58.encode('Hello World!')).toBe('2NEpo7TZRRrLZSi2U')
  })
})

describe('decode', () => {
  test('default (Bytes)', () => {
    expect(Base58.decode('2NEpo7TZRRrLZSi2U')).toEqual(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })

  test('as: Hex', () => {
    expect(Base58.decode('2NEpo7TZRRrLZSi2U', { as: 'Hex' })).toBe(
      '0x48656c6c6f20576f726c6421',
    )
  })

  test('as: String', () => {
    expect(Base58.decode('2NEpo7TZRRrLZSi2U', { as: 'String' })).toBe(
      'Hello World!',
    )
  })
})

test('exports', () => {
  expect(Object.keys(Base58)).toMatchInlineSnapshot(`
    [
      "fromBytes",
      "fromHex",
      "fromString",
      "encode",
      "toBytes",
      "toHex",
      "toString",
      "decode",
      "InvalidCharacterError",
    ]
  `)
})
