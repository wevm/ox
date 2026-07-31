import { WithdrawalSenderTag } from 'ox/tempo'
import { expect, test } from 'vp/test'

test('from', () => {
  const senderTag = WithdrawalSenderTag.from({
    sender: '0x1234567890abcdef1234567890abcdef12345678',
    transactionHash:
      '0xabababababababababababababababababababababababababababababababab',
  })
  expect(senderTag).toMatchInlineSnapshot(
    `"0x3362fade7333b56b9f3582089ec5915b8a6f6ac13e73a7f90c169e3eb81d8a5e"`,
  )
})

test('deterministic', () => {
  const value = {
    sender: '0x1234567890abcdef1234567890abcdef12345678',
    transactionHash:
      '0xabababababababababababababababababababababababababababababababab',
  } as const
  expect(WithdrawalSenderTag.from(value)).toBe(WithdrawalSenderTag.from(value))
})
