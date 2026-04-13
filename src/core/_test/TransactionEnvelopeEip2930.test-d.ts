import { TxEnvelopeEip2930 } from 'ox'
import type { TransactionSerializableEIP2930 } from 'viem'
import { expectTypeOf, test } from 'vitest'

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
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip2930.TxEnvelopeEip2930>()
})

test('Viem type: viem TransactionSerializableEIP2930 assignable', () => {
  const viemTx = {} as TransactionSerializableEIP2930
  expectTypeOf(viemTx).toExtend<TxEnvelopeEip2930.Viem>()
})

test('fromViem', () => {
  const result = TxEnvelopeEip2930.fromViem({
    chainId: 1,
    nonce: 0,
    gasPrice: 1000000000n,
    to: '0x0000000000000000000000000000000000000000',
    type: 'eip2930',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip2930.TxEnvelopeEip2930>()
  expectTypeOf(result.nonce).toEqualTypeOf<bigint | undefined>()
})

test('toViem', () => {
  const result = TxEnvelopeEip2930.toViem({
    chainId: 1,
    nonce: 0n,
    gasPrice: 1000000000n,
    to: '0x0000000000000000000000000000000000000000',
    type: 'eip2930',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip2930.Viem>()
  expectTypeOf(result.nonce).toEqualTypeOf<number | undefined>()
})
