import { TxEnvelopeEip4844 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TxEnvelopeEip4844.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly blobVersionedHashes: readonly [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ]
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly type: 'eip4844'
    }>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip4844.TxEnvelopeEip4844>()
  }

  {
    const envelope = TxEnvelopeEip4844.from(
      '0x123' as TxEnvelopeEip4844.Serialized,
    )
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip4844.TxEnvelopeEip4844>()
  }

  {
    const envelope = TxEnvelopeEip4844.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
      s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
      yParity: 0,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly blobVersionedHashes: readonly [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ]
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d'
      readonly s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540'
      readonly yParity: 0
      readonly type: 'eip4844'
    }>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip4844.TxEnvelopeEip4844>()
  }
})

test('options: signature', () => {
  const envelope = TxEnvelopeEip4844.from(
    {
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
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
    readonly blobVersionedHashes: readonly [
      '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
    ]
    readonly chainId: 1
    readonly to: '0x0000000000000000000000000000000000000000'
    readonly value: 69n
    readonly r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d'
    readonly s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540'
    readonly yParity: 0
    readonly type: 'eip4844'
  }>()
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip4844.TxEnvelopeEip4844>()
})
