import { Transaction } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

describe('mainnet', () => {
  test('returns the mainnet transaction types', () => {
    expect(Transaction.mainnet().map((handler) => handler.type))
      .toMatchInlineSnapshot(`
        [
          "legacy",
          "eip2930",
          "eip1559",
          "eip4844",
          "eip7702",
        ]
      `)
  })
})
