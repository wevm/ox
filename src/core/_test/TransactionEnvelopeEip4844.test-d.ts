import { TransactionEnvelopeEip4844 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip4844.from({
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
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip4844.TransactionEnvelopeEip4844>()
  }

  {
    const envelope = TransactionEnvelopeEip4844.from(
      '0x123' as TransactionEnvelopeEip4844.Serialized,
    )
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip4844.TransactionEnvelopeEip4844>()
  }

  {
    const envelope = TransactionEnvelopeEip4844.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: 0n,
      s: 1n,
      yParity: 0,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly blobVersionedHashes: readonly [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ]
      readonly chainId: 1
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: 0n
      readonly s: 1n
      readonly yParity: 0
      readonly type: 'eip4844'
    }>()
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip4844.TransactionEnvelopeEip4844>()
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeEip4844.from(
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
        r: 0n,
        s: 1n,
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
    readonly r: 0n
    readonly s: 1n
    readonly yParity: 0
    readonly type: 'eip4844'
  }>()
  expectTypeOf(
    envelope,
  ).toMatchTypeOf<TransactionEnvelopeEip4844.TransactionEnvelopeEip4844>()
})
