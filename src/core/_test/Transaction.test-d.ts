import { Transaction } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('toRpc', () => {
  const transaction = {} as Transaction.Transaction
  expectTypeOf(Transaction.toRpc(transaction)).toEqualTypeOf<Transaction.Rpc>()

  const pending = {} as Transaction.Transaction<true>
  expectTypeOf(Transaction.toRpc<true>(pending)).toEqualTypeOf<
    Transaction.Rpc<true>
  >()
})
