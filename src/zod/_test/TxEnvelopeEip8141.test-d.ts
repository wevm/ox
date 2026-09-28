import type { Transaction, TransactionRequest, TxEnvelopeEip8141 } from 'ox'
import { z } from 'ox/zod'
import { describe, expectTypeOf, test } from 'vp/test'

describe('TxEnvelopeEip8141', () => {
  test('nonce keys preserve decoded, RPC, and numberish types', () => {
    expectTypeOf<
      z.output<typeof z.TxEnvelopeEip8141.Decoded>
    >().toEqualTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
    expectTypeOf<
      z.input<typeof z.TxEnvelopeEip8141.TxEnvelopeEip8141>
    >().toEqualTypeOf<TxEnvelopeEip8141.Rpc>()
    expectTypeOf<
      z.output<typeof z.TxEnvelopeEip8141.TxEnvelopeEip8141ToRpc>
    >().toMatchTypeOf<TxEnvelopeEip8141.toRpc.Input>()
    expectTypeOf<
      z.output<typeof z.TransactionRequest.TransactionRequest>['nonceKeys']
    >().toEqualTypeOf<TransactionRequest.TransactionRequest['nonceKeys']>()
    expectTypeOf<
      z.input<typeof z.TransactionRequest.TransactionRequest>['nonceKeys']
    >().toEqualTypeOf<TransactionRequest.Rpc['nonceKeys']>()
    expectTypeOf<
      z.output<typeof z.Transaction.Eip8141>['nonceKeys']
    >().toEqualTypeOf<Transaction.Eip8141['nonceKeys']>()
    expectTypeOf<
      z.input<typeof z.Transaction.Eip8141>['nonceKeys']
    >().toEqualTypeOf<Transaction.Eip8141Rpc['nonceKeys']>()
  })
})
