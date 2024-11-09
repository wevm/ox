import { TransactionEnvelopeEip1559 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip1559.from({
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
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip1559.TransactionEnvelopeEip1559>()
  }

  {
    const envelope = TransactionEnvelopeEip1559.from(
      '0x123' as TransactionEnvelopeEip1559.Serialized,
    )
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip1559.TransactionEnvelopeEip1559>()
  }

  {
    const envelope = TransactionEnvelopeEip1559.from({
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
      readonly type: 'eip1559'
    }>()
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip1559.TransactionEnvelopeEip1559>()
  }
})
