import { TxEnvelopeEip4844 } from 'ox'
import type { TransactionSerializableEIP4844 } from 'viem'
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
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip4844.TxEnvelopeEip4844>()
})

test('Viem type: viem TransactionSerializableEIP4844 assignable', () => {
  const viemTx = {} as TransactionSerializableEIP4844<
    bigint,
    number,
    false
  > & {
    blobVersionedHashes: readonly `0x${string}`[]
  }
  expectTypeOf(viemTx).toExtend<TxEnvelopeEip4844.Viem>()
})

test('fromViem', () => {
  const result = TxEnvelopeEip4844.fromViem({
    chainId: 1,
    nonce: 0,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000n,
    to: '0x0000000000000000000000000000000000000000',
    blobVersionedHashes: [
      '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
    ],
    type: 'eip4844',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip4844.TxEnvelopeEip4844>()
  expectTypeOf(result.nonce).toEqualTypeOf<bigint | undefined>()
})

test('toViem', () => {
  const result = TxEnvelopeEip4844.toViem({
    chainId: 1,
    nonce: 0n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000n,
    to: '0x0000000000000000000000000000000000000000',
    blobVersionedHashes: [
      '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
    ],
    type: 'eip4844',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip4844.Viem>()
  expectTypeOf(result.nonce).toEqualTypeOf<number | undefined>()
})
