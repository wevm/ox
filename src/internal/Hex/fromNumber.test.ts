import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.fromNumber(0)).toMatchInlineSnapshot(`"0x00"`)
  expect(Hex.fromNumber(7)).toMatchInlineSnapshot(`"0x07"`)
  expect(Hex.fromNumber(69)).toMatchInlineSnapshot('"0x45"')
  expect(Hex.fromNumber(420)).toMatchInlineSnapshot(`"0x01a4"`)

  expect(() =>
    // biome-ignore lint/correctness/noPrecisionLoss: precision loss expected for test
    Hex.fromNumber(420182738912731283712937129),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.IntegerOutOfRangeError: Number `4.2018273891273126e+26` is not in safe unsigned integer range (`0` to `9007199254740991`)]',
  )
  expect(() => Hex.fromNumber(-69)).toThrowErrorMatchingInlineSnapshot(
    '[Hex.IntegerOutOfRangeError: Number `-69` is not in safe unsigned integer range (`0` to `9007199254740991`)]',
  )
})

test('args: size', () => {
  expect(Hex.fromNumber(7, { size: 1 })).toBe('0x07')
  expect(Hex.fromNumber(10, { size: 2 })).toBe('0x000a')
  expect(Hex.fromNumber(69, { size: 4 })).toBe('0x00000045')
  expect(Hex.fromNumber(69, { size: 32 })).toBe(
    '0x0000000000000000000000000000000000000000000000000000000000000045',
  )

  expect(() =>
    Hex.fromNumber(-7, { size: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.IntegerOutOfRangeError: Number `-7` is not in safe 8-bit unsigned integer range (`0` to `255`)]',
  )
  expect(() =>
    Hex.fromNumber(256, { size: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.IntegerOutOfRangeError: Number `256` is not in safe 8-bit unsigned integer range (`0` to `255`)]',
  )
  expect(() =>
    Hex.fromNumber(65536, { size: 2 }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.IntegerOutOfRangeError: Number `65536` is not in safe 16-bit unsigned integer range (`0` to `65535`)]',
  )
})

test('args: signed', () => {
  expect(Hex.fromNumber(32, { size: 1, signed: true })).toBe('0x20')
  expect(
    Hex.fromNumber(-32, {
      size: 1,
      signed: true,
    }),
  ).toBe('0xe0')
  expect(
    Hex.fromNumber(-32, {
      size: 4,
      signed: true,
    }),
  ).toBe('0xffffffe0')

  expect(Hex.fromNumber(127, { size: 2, signed: true })).toBe('0x007f')
  expect(Hex.fromNumber(-127, { size: 2, signed: true })).toBe('0xff81')
  expect(Hex.fromNumber(32767, { size: 2, signed: true })).toBe('0x7fff')
  expect(Hex.fromNumber(-32768, { size: 2, signed: true })).toBe('0x8000')
  expect(() =>
    Hex.fromNumber(32768, { size: 2, signed: true }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.IntegerOutOfRangeError: Number `32768` is not in safe 16-bit signed integer range (`-32768` to `32767`)]',
  )
  expect(() =>
    Hex.fromNumber(-32769, { size: 2, signed: true }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.IntegerOutOfRangeError: Number `-32769` is not in safe 16-bit signed integer range (`-32768` to `32767`)]',
  )
})
