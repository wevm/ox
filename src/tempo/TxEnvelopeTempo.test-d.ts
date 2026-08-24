import { expectTypeOf, test } from 'vp/test'
import type * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

test('Serialized', () => {
  expectTypeOf<'0x76'>().toExtend<TxEnvelopeTempo.Serialized>()
  expectTypeOf<'0x78'>().toExtend<TxEnvelopeTempo.Serialized>()
})
