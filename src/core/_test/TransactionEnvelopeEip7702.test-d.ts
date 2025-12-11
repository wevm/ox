import { TxEnvelopeEip7702 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TxEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly authorizationList: readonly []
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly type: 'eip7702'
    }>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip7702.TxEnvelopeEip7702>()
  }

  {
    const envelope = TxEnvelopeEip7702.from(
      '0x123' as TxEnvelopeEip7702.Serialized,
    )
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip7702.TxEnvelopeEip7702>()
  }

  {
    const envelope = TxEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
      s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
      yParity: 0,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly authorizationList: readonly []
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d'
      readonly s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540'
      readonly yParity: 0
      readonly type: 'eip7702'
    }>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip7702.TxEnvelopeEip7702>()
  }
})

test('options: signature', () => {
  const envelope = TxEnvelopeEip7702.from(
    {
      authorizationList: [],
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    },
    {
      signature: {
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: 0,
      },
    },
  )
  expectTypeOf(envelope).toEqualTypeOf<{
    readonly authorizationList: readonly []
    readonly chainId: 1
    readonly to: '0x0000000000000000000000000000000000000000'
    readonly value: 69n
    readonly r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d'
    readonly s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540'
    readonly yParity: 0
    readonly type: 'eip7702'
  }>()
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip7702.TxEnvelopeEip7702>()
})
