import type * as core_TxEnvelopeTempo from '../../../tempo/TxEnvelopeTempo.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TxEnvelopeTempo from '../TxEnvelopeTempo.js'

test('TxEnvelopeTempo accepts a tempo transaction envelope', () => {
  expectTypeOf<
    z.output<typeof z_TxEnvelopeTempo.TxEnvelopeTempo>
  >().toMatchTypeOf<core_TxEnvelopeTempo.TxEnvelopeTempo>()
})

test('Signed accepts a signed tempo transaction envelope', () => {
  expectTypeOf<
    z.output<typeof z_TxEnvelopeTempo.Signed>
  >().toMatchTypeOf<core_TxEnvelopeTempo.Signed>()
})
