import { TransactionEnvelopeEip7702 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip7702.from({
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
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip7702.TransactionEnvelopeEip7702>()
  }

  {
    const envelope = TransactionEnvelopeEip7702.from(
      '0x123' as TransactionEnvelopeEip7702.Serialized,
    )
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip7702.TransactionEnvelopeEip7702>()
  }

  {
    const envelope = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: 0n,
      s: 1n,
      yParity: 0,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly authorizationList: readonly []
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: 0n
      readonly s: 1n
      readonly yParity: 0
      readonly type: 'eip7702'
    }>()
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip7702.TransactionEnvelopeEip7702>()
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeEip7702.from(
    {
      authorizationList: [],
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
    readonly authorizationList: readonly []
    readonly chainId: 1
    readonly to: '0x0000000000000000000000000000000000000000'
    readonly value: 69n
    readonly r: 0n
    readonly s: 1n
    readonly yParity: 0
    readonly type: 'eip7702'
  }>()
  expectTypeOf(
    envelope,
  ).toMatchTypeOf<TransactionEnvelopeEip7702.TransactionEnvelopeEip7702>()
})
