import { describe, expect, test } from 'vitest'
import * as WithdrawalSenderTag from './WithdrawalSenderTag.js'

describe('from', () => {
  test('derives the production sender tag', () => {
    expect(
      WithdrawalSenderTag.from({
        fallbackNonce: 19n,
        sender: '0x0F0896dbf0465E5c07963301dcFEA1101Fa91EaC',
        transactionHash:
          '0xae628bdc4bd24a9f9a917825a208baa16c384ab8a96a40cd5146bd20d9b3f6d9',
      }),
    ).toMatchInlineSnapshot(
      `"0xf1acbae45cd689281144042331e3379cf631a8d2db83057ccf38754a0b0108f2"`,
    )
  })

  test('derives the canonical internal deposit bounce-back tag', () => {
    expect(
      WithdrawalSenderTag.from({
        fallbackNonce: 0n,
        sender: '0x0000000000000000000000000000000000000000',
        transactionHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(
      `"0xa86d54e9aab41ae5e520ff0062ff1b4cbd0b2192bb01080a058bb170d84e6457"`,
    )
  })
})
