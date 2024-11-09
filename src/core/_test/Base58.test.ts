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
      '[Error: invalid base58 character: I]',
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

test('exports', () => {
  expect(Object.keys(Base58)).toMatchInlineSnapshot(`
    [
      "fromBytes",
      "fromHex",
      "fromString",
      "toBytes",
      "toHex",
      "toString",
    ]
  `)
})
