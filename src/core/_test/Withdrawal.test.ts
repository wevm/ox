import { Withdrawal } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromRpc', () => {
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
})

describe('toRpc', () => {
  test('default', () => {
    const withdrawal = Withdrawal.toRpc({
      address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
      amount: 6423331n,
      index: 0,
      validatorIndex: 1,
    })

    expect(withdrawal).toMatchInlineSnapshot(`
      {
        "address": "0x00000000219ab540356cBB839Cbe05303d7705Fa",
        "amount": "0x620323",
        "index": "0x00",
        "validatorIndex": "0x01",
      }
    `)
  })
})

test('exports', () => {
  expect(Object.keys(Withdrawal)).toMatchInlineSnapshot(`
    [
      "fromRpc",
      "toRpc",
    ]
  `)
})
