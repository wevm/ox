import { Base58 } from 'ox'
import { describe, expect, test } from 'vitest'

describe('encode', () => {
  test('default', () => {
    expect(
      Base58.encode(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toBe('2NEpo7TZRRrLZSi2U')
  })
})

describe('encode', () => {
  test('default', () => {
    expect(Base58.encode('0x00000000287fb4cd')).toBe('1111233QC4')
  })
})

describe('encode', () => {
  test('default', () => {
    expect(Base58.encode('Hello World!')).toBe('2NEpo7TZRRrLZSi2U')
    expect(Base58.encode('The quick brown fox jumps over the lazy dog.')).toBe(
      'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z',
    )
  })
})

describe('decode', () => {
  test('default', () => {
    expect(Base58.decode('2NEpo7TZRRrLZSi2U')).toMatchInlineSnapshot(`
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

describe('decode', () => {
  test('default', () => {
    expect(Base58.decode('233QC4', { as: 'Hex' })).toBe('0x287fb4cd')
    expect(Base58.decode('11233QC4', { as: 'Hex' })).toBe('0x0000287fb4cd')
    expect(() =>
      Base58.decode('233QC4I', { as: 'Hex' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Base58.InvalidCharacterError: Invalid Base58 character: "I".]`,
    )
  })
})

describe('decode', () => {
  test('default', () => {
    expect(Base58.decode('2NEpo7TZRRrLZSi2U', { as: 'String' })).toBe(
      'Hello World!',
    )
    expect(
      Base58.decode(
        'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z',
        { as: 'String' },
      ),
    ).toBe('The quick brown fox jumps over the lazy dog.')
  })
})

test('exports', () => {
  expect(Object.keys(Base58)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "InvalidCharacterError",
    ]
  `)
})
