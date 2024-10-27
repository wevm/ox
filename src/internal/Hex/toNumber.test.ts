import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.toNumber('0x0')).toMatchInlineSnapshot('0')
  expect(Hex.toNumber('0x7')).toMatchInlineSnapshot('7')
  expect(Hex.toNumber('0x45')).toMatchInlineSnapshot('69')
  expect(Hex.toNumber('0x1a4')).toMatchInlineSnapshot('420')
})

test('args: signed', () => {
  expect(Hex.toNumber('0x20', { signed: true })).toBe(32)
  expect(
    Hex.toNumber('0xe0', {
      signed: true,
    }),
  ).toBe(-32)
  expect(
    Hex.toNumber('0xffffffe0', {
      signed: true,
    }),
  ).toBe(-32)

  expect(Hex.toNumber('0x007f', { signed: true })).toBe(127)
  expect(Hex.toNumber('0xff81', { signed: true })).toBe(-127)
  expect(Hex.toNumber('0x7fff', { signed: true })).toBe(32767)
  expect(Hex.toNumber('0x8000', { signed: true })).toBe(-32768)

  expect(Hex.toNumber('0xffff', { signed: true })).toBe(-1)
  expect(Hex.toNumber('0x4961769b', { signed: true })).toBe(1231124123)
  expect(Hex.toNumber('0x00027760a62ec2ac', { signed: true })).toBe(
    694206942069420,
  )
})

test('args: size', () => {
  expect(
    Hex.toNumber(Hex.fromNumber(69420, { size: 32 }), {
      size: 32,
    }),
  ).toEqual(69420)
})

test('error: size overflow', () => {
  expect(() =>
    Hex.toNumber(Hex.fromNumber(69420, { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
  )
})
