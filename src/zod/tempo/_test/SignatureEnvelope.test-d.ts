import type * as core_SignatureEnvelope from '../../../tempo/SignatureEnvelope.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_SignatureEnvelope from '../SignatureEnvelope.js'

test('SignatureEnvelope decodes RPC into a signature envelope', () => {
  expectTypeOf<core_SignatureEnvelope.SignatureEnvelopeRpc>().toExtend<
    z.input<typeof z_SignatureEnvelope.SignatureEnvelope>
  >()
  expectTypeOf<core_SignatureEnvelope.SignatureEnvelope>().toExtend<
    z.output<typeof z_SignatureEnvelope.SignatureEnvelope>
  >()
})

test('MultisigRpc preserves the native multisig RPC union', () => {
  expectTypeOf<core_SignatureEnvelope.MultisigRpc>().toExtend<
    z.input<typeof z_SignatureEnvelope.MultisigRpc>
  >()
  expectTypeOf<
    z.output<typeof z_SignatureEnvelope.MultisigRpc>
  >().toExtend<core_SignatureEnvelope.MultisigRpc>()
})

test('Type preserves the key type union', () => {
  expectTypeOf<
    z.output<typeof z_SignatureEnvelope.Type>
  >().toEqualTypeOf<core_SignatureEnvelope.Type>()
})
