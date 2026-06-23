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

  test('leading zeros (all-zero value)', () => {
    expect(Base58.fromHex('0x00')).toBe('1')
    expect(Base58.fromHex('0x0000')).toBe('11')
    expect(Base58.fromHex('0x000000')).toBe('111')
  })

  test('empty', () => {
    expect(Base58.fromHex('0x')).toBe('')
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

  test('leading zeros', () => {
    expect(Base58.toBytes('1')).toStrictEqual(new Uint8Array([0]))
    expect(Base58.toBytes('1112NEpo7TZRRrLZSi2U')).toStrictEqual(
      new Uint8Array([
        0, 0, 0, 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
      ]),
    )
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

  test('leading ones (all-zero value)', () => {
    expect(Base58.toHex('1')).toBe('0x00')
    expect(Base58.toHex('11')).toBe('0x0000')
    expect(Base58.toHex('111')).toBe('0x000000')
  })

  test('empty', () => {
    expect(Base58.toHex('')).toBe('0x')
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
