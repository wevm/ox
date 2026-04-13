import { TxEnvelopeEip1559 } from 'ox'
import type { TransactionSerializableEIP1559 } from 'viem'
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
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  }
})

test('Viem type: viem TransactionSerializableEIP1559 assignable', () => {
  const viemTx = {} as TransactionSerializableEIP1559
  expectTypeOf(viemTx).toExtend<TxEnvelopeEip1559.Viem>()
})

test('fromViem', () => {
  const result = TxEnvelopeEip1559.fromViem({
    chainId: 1,
    nonce: 0,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000n,
    to: '0x0000000000000000000000000000000000000000',
    type: 'eip1559',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  expectTypeOf(result.nonce).toEqualTypeOf<bigint | undefined>()
})

test('toViem', () => {
  const result = TxEnvelopeEip1559.toViem({
    chainId: 1,
    nonce: 0n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000n,
    to: '0x0000000000000000000000000000000000000000',
    type: 'eip1559',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip1559.Viem>()
  expectTypeOf(result.nonce).toEqualTypeOf<number | undefined>()
})
