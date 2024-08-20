import { expectTypeOf, test } from 'vitest'
import { TransactionEnvelope } from 'ox'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeLegacy,
} from '../types/transactionEnvelope.js'

test('legacy', () => {
  {
    const envelope = {} as TransactionEnvelopeLegacy
    expectTypeOf(envelope.type).toEqualTypeOf<'legacy'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy<false>>()
    expectTypeOf(envelope).toMatchTypeOf<
      // @ts-expect-error
      TransactionEnvelopeLegacy<true>
    >()

    // Signature discriminant
    expectTypeOf(envelope.r).toEqualTypeOf<bigint | undefined>()
    if (envelope.r) {
      expectTypeOf(envelope.s).toEqualTypeOf<bigint>()
      expectTypeOf(envelope.v).toEqualTypeOf<number>()
    }
  }

  {
    const envelope = {} as TransactionEnvelopeLegacy<true>
    expectTypeOf(envelope.type).toEqualTypeOf<'legacy'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy<true>>()

    expectTypeOf(envelope.r).toEqualTypeOf<bigint>()
    expectTypeOf(envelope.s).toEqualTypeOf<bigint>()
    expectTypeOf(envelope.v).toEqualTypeOf<number>()
  }

  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy<false>>()
    expectTypeOf(envelope).toMatchTypeOf<
      // @ts-expect-error
      TransactionEnvelopeLegacy<true>
    >()
  }

  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
      r: 0n,
      s: 0n,
      v: 27,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy<true>>()
  }
})

test('eip1559', () => {
  {
    const envelope = {} as TransactionEnvelopeEip1559
    expectTypeOf(envelope.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559<false>>()
    expectTypeOf(envelope).toMatchTypeOf<
      // @ts-expect-error
      TransactionEnvelopeEip1559<true>
    >()

    // Signature discriminant
    expectTypeOf(envelope.r).toEqualTypeOf<bigint | undefined>()
    if (envelope.r) {
      expectTypeOf(envelope.s).toEqualTypeOf<bigint>()
      expectTypeOf(envelope.v).toEqualTypeOf<number | undefined>()
      expectTypeOf(envelope.yParity).toEqualTypeOf<0 | 1 | undefined>()
    }
  }

  {
    const envelope = {} as TransactionEnvelopeEip1559<true>
    expectTypeOf(envelope.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559<true>>()

    expectTypeOf(envelope.r).toEqualTypeOf<bigint>()
    expectTypeOf(envelope.s).toEqualTypeOf<bigint>()
    expectTypeOf(envelope.v).toEqualTypeOf<number | undefined>()
    expectTypeOf(envelope.yParity).toEqualTypeOf<0 | 1 | undefined>()
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip1559',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559<false>>()
    expectTypeOf(envelope).toMatchTypeOf<
      // @ts-expect-error
      TransactionEnvelopeLegacy<true>
    >()
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip1559',
      r: 0n,
      s: 0n,
      v: 27,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559<false>>()
    expectTypeOf(envelope).toMatchTypeOf<
      // @ts-expect-error
      TransactionEnvelopeLegacy<true>
    >()
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip1559',
      r: 0n,
      s: 0n,
      yParity: 1,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559<false>>()
    expectTypeOf(envelope).toMatchTypeOf<
      // @ts-expect-error
      TransactionEnvelopeLegacy<true>
    >()
  }
})
