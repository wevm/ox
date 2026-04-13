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
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip7702.TxEnvelopeEip7702>()
})

test('Viem type', () => {
  const oxViem = {} as TxEnvelopeEip7702.Viem
  expectTypeOf(oxViem.type).toEqualTypeOf<'eip7702' | undefined>()
  expectTypeOf(oxViem.nonce).toEqualTypeOf<number | undefined>()
  expectTypeOf(oxViem.chainId).toEqualTypeOf<number>()
  expectTypeOf(oxViem.authorizationList).toExtend<
    readonly { address: string; chainId: number; nonce: number }[]
  >()
})

test('fromViem', () => {
  const result = TxEnvelopeEip7702.fromViem({
    chainId: 1,
    nonce: 0,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000n,
    to: '0x0000000000000000000000000000000000000000',
    authorizationList: [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        nonce: 0,
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000000',
        yParity: 0,
      },
    ],
    type: 'eip7702',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip7702.TxEnvelopeEip7702>()
  expectTypeOf(result.nonce).toEqualTypeOf<bigint | undefined>()
})

test('toViem', () => {
  const result = TxEnvelopeEip7702.toViem({
    chainId: 1,
    nonce: 0n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000n,
    to: '0x0000000000000000000000000000000000000000',
    authorizationList: [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        nonce: 0n,
        r: 0n,
        s: 0n,
        yParity: 0,
      },
    ],
    type: 'eip7702',
  })
  expectTypeOf(result).toExtend<TxEnvelopeEip7702.Viem>()
  expectTypeOf(result.nonce).toEqualTypeOf<number | undefined>()
})
