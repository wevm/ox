import { TransactionEnvelopeEip2930 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip2930.from({
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly type: 'eip2930'
    }>()
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip2930.TransactionEnvelope>()
  }

  {
    const envelope = TransactionEnvelopeEip2930.from(
      '0x123' as TransactionEnvelopeEip2930.Serialized,
    )
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip2930.TransactionEnvelope>()
  }

  {
    const envelope = TransactionEnvelopeEip2930.from({
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: 0n,
      s: 1n,
      yParity: 0,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: 0n
      readonly s: 1n
      readonly yParity: 0
      readonly type: 'eip2930'
    }>()
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip2930.TransactionEnvelope>()
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeEip2930.from(
    {
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    },
    {
      signature: {
        r: 0n,
        s: 1n,
        yParity: 0,
      },
    },
  )
  expectTypeOf(envelope).toEqualTypeOf<{
    readonly chainId: 1
    readonly to: '0x0000000000000000000000000000000000000000'
    readonly value: 69n
    readonly r: 0n
    readonly s: 1n
    readonly yParity: 0
    readonly type: 'eip2930'
  }>()
  expectTypeOf(
    envelope,
  ).toMatchTypeOf<TransactionEnvelopeEip2930.TransactionEnvelope>()
})
