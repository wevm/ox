import { TxEnvelopeEip2930 } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('default', () => {
  {
    const envelope = TxEnvelopeEip2930.from({
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
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip2930.TxEnvelopeEip2930>()
  }

  {
    const envelope = TxEnvelopeEip2930.from(
      '0x123' as TxEnvelopeEip2930.Serialized,
    )
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip2930.TxEnvelopeEip2930>()
  }

  {
    const envelope = TxEnvelopeEip2930.from({
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: '0x0000000000000000000000000000000000000000000000000000000000000000',
      s: '0x0000000000000000000000000000000000000000000000000000000000000001',
      yParity: 0,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: '0x0000000000000000000000000000000000000000000000000000000000000000'
      readonly s: '0x0000000000000000000000000000000000000000000000000000000000000001'
      readonly yParity: 0
      readonly type: 'eip2930'
    }>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip2930.TxEnvelopeEip2930>()
  }
})

test('options: signature', () => {
  const envelope = TxEnvelopeEip2930.from(
    {
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    },
    {
      signature: {
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000001',
        yParity: 0,
      },
    },
  )
  expectTypeOf(envelope).toEqualTypeOf<{
    readonly chainId: 1
    readonly to: '0x0000000000000000000000000000000000000000'
    readonly value: 69n
    readonly r: '0x0000000000000000000000000000000000000000000000000000000000000000'
    readonly s: '0x0000000000000000000000000000000000000000000000000000000000000001'
    readonly yParity: 0
    readonly type: 'eip2930'
  }>()
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip2930.TxEnvelopeEip2930>()
})
