import { TransactionEnvelope } from 'ox'
import { expectTypeOf, test } from 'vitest'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeLegacy,
} from '../types/transactionEnvelope.js'

test('legacy', () => {
  {
    const envelope = {} as TransactionEnvelopeLegacy
    expectTypeOf(envelope.type).toEqualTypeOf<'legacy'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
  }

  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
  }

  {
    const envelope = TransactionEnvelope.fromLegacy({})
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
  }
})

test('eip1559', () => {
  {
    const envelope = {} as TransactionEnvelopeEip1559
    expectTypeOf(envelope.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip1559',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
  }

  {
    const envelope = TransactionEnvelope.fromEip1559({
      chainId: 1,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
  }
})

test('cannot infer transaction type', () => {
  const envelope = TransactionEnvelope.from({ chainId: 1 })
  expectTypeOf(envelope).toEqualTypeOf<never>()
})
