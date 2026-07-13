import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_RpcSchemaTempo from '../RpcSchemaTempo.js'

test('tempo_simulateV1 has the expected method name', () => {
  expectTypeOf<
    typeof z_RpcSchemaTempo.tempo_simulateV1.method
  >().toEqualTypeOf<'tempo_simulateV1'>()
})

test('tempo_simulateV1 params accept a simple call', () => {
  type Params = z.input<typeof z_RpcSchemaTempo.tempo_simulateV1.params>
  expectTypeOf<{
    blockStateCalls: readonly { calls?: readonly never[] | undefined }[]
  }>().toExtend<Params[0]>()
})

test('Tempo namespace exposes tempo_simulateV1', () => {
  expectTypeOf<typeof z_RpcSchemaTempo.Tempo.tempo_simulateV1>().toEqualTypeOf<
    typeof z_RpcSchemaTempo.tempo_simulateV1
  >()
})
