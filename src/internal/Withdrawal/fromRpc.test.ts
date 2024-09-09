import { Withdrawal } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const withdrawal = Withdrawal.fromRpc({
    address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
    amount: '0x620323',
    index: '0x0',
    validatorIndex: '0x1',
  })

  expect(withdrawal).toMatchInlineSnapshot(`
    {
      "address": "0x00000000219ab540356cBB839Cbe05303d7705Fa",
      "amount": 6423331n,
      "index": 0,
      "validatorIndex": 1,
    }
  `)
})
