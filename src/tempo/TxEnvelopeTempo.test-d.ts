import { expectTypeOf, test } from 'vitest'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

test('Viem type: field types', () => {
  const oxViem = {} as TxEnvelopeTempo.Viem
  expectTypeOf(oxViem.type).toEqualTypeOf<'tempo' | undefined>()
  expectTypeOf(oxViem.nonce).toEqualTypeOf<number | undefined>()
  expectTypeOf(oxViem.chainId).toEqualTypeOf<number>()
})

test('fromViem: returns ox TxEnvelopeTempo', () => {
  const result = TxEnvelopeTempo.fromViem({
    calls: [{ to: '0x0000000000000000000000000000000000000000' }],
    chainId: 1,
    nonce: 0,
  })
  expectTypeOf(result).toExtend<TxEnvelopeTempo.TxEnvelopeTempo>()
  expectTypeOf(result.nonce).toEqualTypeOf<bigint | undefined>()
  expectTypeOf(result.type).toEqualTypeOf<'tempo'>()
})

test('toViem: returns Viem type', () => {
  const result = TxEnvelopeTempo.toViem({
    calls: [{ to: '0x0000000000000000000000000000000000000000' }],
    chainId: 1,
    nonce: 0n,
    type: 'tempo',
  })
  expectTypeOf(result).toExtend<TxEnvelopeTempo.Viem>()
  expectTypeOf(result.nonce).toEqualTypeOf<number | undefined>()
})
