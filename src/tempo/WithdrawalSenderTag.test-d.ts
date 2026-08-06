import type { Hex } from 'ox'
import { WithdrawalSenderTag } from 'ox/tempo'
import { expectTypeOf, test } from 'vp/test'

test('from', () => {
  expectTypeOf(
    WithdrawalSenderTag.from({
      fallbackNonce: 19n,
      sender: '0x1234567890abcdef1234567890abcdef12345678',
      transactionHash:
        '0xabababababababababababababababababababababababababababababababab',
    }),
  ).toEqualTypeOf<Hex.Hex>()
})
