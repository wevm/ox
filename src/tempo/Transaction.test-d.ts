import { Transaction } from 'ox/tempo'
import { expectTypeOf, test } from 'vitest'

test('toRpc', () => {
  const transaction = {} as Transaction.Transaction
  expectTypeOf(Transaction.toRpc(transaction)).toEqualTypeOf<Transaction.Rpc>()

  const pending = {} as Transaction.Transaction<true>
  expectTypeOf(Transaction.toRpc(pending)).toEqualTypeOf<
    Transaction.Rpc<true>
  >()
})
