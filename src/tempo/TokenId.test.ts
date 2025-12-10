import { TokenId } from 'ox/tempo'
import { expect, test } from 'vitest'

test('from', () => {
  expect(TokenId.from(0n)).toBe(0n)
  expect(TokenId.from(0x1)).toBe(1n)
  expect(TokenId.from(0xdef)).toBe(0xdefn)
  expect(TokenId.from('0x20c0000000000000000000000000000000000000')).toBe(0n)
  expect(TokenId.from('0x20c0000000000000000000000000000000000001')).toBe(1n)
  expect(TokenId.from('0x20c0000000000000000000000000000000000def')).toBe(
    0xdefn,
  )
})

test('fromAddress', () => {
  expect(
    TokenId.fromAddress('0x20c0000000000000000000000000000000000000'),
  ).toBe(0n)
  expect(
    TokenId.fromAddress('0x20c0000000000000000000000000000000000001'),
  ).toBe(1n)
  expect(
    TokenId.fromAddress('0x20c0000000000000000000000000000000000def'),
  ).toBe(0xdefn)
})

test('toAddress', () => {
  expect(TokenId.toAddress(0n)).toBe(
    '0x20c0000000000000000000000000000000000000',
  )
  expect(TokenId.toAddress('0x20c0000000000000000000000000000000000000')).toBe(
    '0x20c0000000000000000000000000000000000000',
  )
  expect(TokenId.toAddress(1n)).toBe(
    '0x20c0000000000000000000000000000000000001',
  )
  expect(TokenId.toAddress(0xdefn)).toBe(
    '0x20c0000000000000000000000000000000000def',
  )
})
