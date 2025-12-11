import { TxEnvelopeEip1559 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TxEnvelopeEip1559.from({
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly type: 'eip1559'
    }>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  }

  {
    const envelope = TxEnvelopeEip1559.from(
      '0x123' as TxEnvelopeEip1559.Serialized,
    )
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  }

  {
    const envelope = TxEnvelopeEip1559.from({
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
      s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
      yParity: 0,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d'
      readonly s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540'
      readonly yParity: 0
      readonly type: 'eip1559'
    }>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  }
})
