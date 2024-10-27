import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.toBigInt('0x0')).toMatchInlineSnapshot('0n')
  expect(Hex.toBigInt('0x7')).toMatchInlineSnapshot('7n')
  expect(Hex.toBigInt('0x45')).toMatchInlineSnapshot('69n')
  expect(Hex.toBigInt('0x1a4')).toMatchInlineSnapshot('420n')
  expect(
    Hex.toBigInt('0xc5cf39211876fb5e5884327fa56fc0b75'),
  ).toMatchInlineSnapshot('4206942069420694206942069420694206942069n')
})

test('args: signed', () => {
  expect(Hex.toBigInt('0x20', { signed: true })).toBe(32n)
  expect(
    Hex.toBigInt('0xe0', {
      signed: true,
    }),
  ).toBe(-32n)

  expect(Hex.toBigInt('0x007f', { signed: true })).toBe(127n)
  expect(Hex.toBigInt('0xff81', { signed: true })).toBe(-127n)
  expect(Hex.toBigInt('0x7fff', { signed: true })).toBe(32767n)
  expect(Hex.toBigInt('0x8000', { signed: true })).toBe(-32768n)

  expect(
    Hex.toBigInt(
      '0x000000000000000000000000000000000000000000000000aade1ed08b0b325c',
      {
        signed: true,
      },
    ),
  ).toBe(12312312312312312412n)
  expect(
    Hex.toBigInt(
      '0xffffffffffffffffffffffffffffffffffffffffffffffff5521e12f74f4cda4',
      {
        signed: true,
      },
    ),
  ).toBe(-12312312312312312412n)
})

test('args: size', () => {
  expect(
    Hex.toBigInt(Hex.fromNumber(69420n, { size: 32 }), {
      size: 32,
    }),
  ).toEqual(69420n)
})

test('error: size overflow', () => {
  expect(() =>
    Hex.toBigInt(Hex.fromNumber(69420, { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
  )
})
