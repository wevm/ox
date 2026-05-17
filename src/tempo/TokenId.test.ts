import { Hex } from 'ox'
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

test('compute', () => {
  const sender = '0x1234567890123456789012345678901234567890'
  const salt1 =
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  const salt2 =
    '0x0000000000000000000000000000000000000000000000000000000000000002'

  const id1 = TokenId.compute({ sender, salt: salt1 })
  const id2 = TokenId.compute({ sender, salt: salt2 })
  const address1 = TokenId.toAddress(id1)
  const address2 = TokenId.toAddress(id2)

  // deterministic: same inputs produce same output
  expect(TokenId.compute({ sender, salt: salt1 })).toBe(id1)

  // different salts produce different addresses
  expect(address1).not.toBe(address2)

  // address suffix matches id
  expect(Hex.slice(address1, 12)).toBe(Hex.fromNumber(id1, { size: 8 }))

  // addresses have TIP-20 prefix (0x20c0 followed by zeroes for 12 bytes total)
  expect(address1.toLowerCase().startsWith('0x20c000000000000000000000')).toBe(
    true,
  )
  expect(address2.toLowerCase().startsWith('0x20c000000000000000000000')).toBe(
    true,
  )

  // addresses are 20 bytes (40 hex chars + 0x prefix)
  expect(address1.length).toBe(42)

  // different senders produce different addresses
  const otherSender = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const address3 = TokenId.compute({ sender: otherSender, salt: salt1 })
  expect(address3).not.toBe(address1)
})
