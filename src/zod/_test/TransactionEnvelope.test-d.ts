import type * as core_TransactionEnvelope from '../../core/TxEnvelope.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TransactionEnvelope from '../TransactionEnvelope.js'

test('TransactionEnvelope schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_TransactionEnvelope.Base>
  >().toMatchTypeOf<core_TransactionEnvelope.Base>()
  expectTypeOf<core_TransactionEnvelope.BaseRpc>().toMatchTypeOf<
    z.input<typeof z_TransactionEnvelope.Base>
  >()
  expectTypeOf<
    z.output<typeof z_TransactionEnvelope.BaseSigned>
  >().toMatchTypeOf<core_TransactionEnvelope.BaseSigned>()
  expectTypeOf<
    z.output<typeof z_TransactionEnvelope.TransactionEnvelope>
  >().toMatchTypeOf<core_TransactionEnvelope.TxEnvelope>()
  expectTypeOf<core_TransactionEnvelope.Rpc>().toMatchTypeOf<
    z.input<typeof z_TransactionEnvelope.TransactionEnvelope>
  >()
  expectTypeOf<z.output<typeof z_TransactionEnvelope.Signed>>().toMatchTypeOf<
    core_TransactionEnvelope.TxEnvelope<true>
  >()
  expectTypeOf<core_TransactionEnvelope.Rpc<true>>().toMatchTypeOf<
    z.input<typeof z_TransactionEnvelope.Signed>
  >()

  expectTypeOf<core_TransactionEnvelope.Serialized>().toMatchTypeOf<
    z.input<typeof z_TransactionEnvelope.serialized>
  >()
  expectTypeOf<
    z.output<typeof z_TransactionEnvelope.serialized>
  >().toMatchTypeOf<core_TransactionEnvelope.TxEnvelope<true>>()
})
