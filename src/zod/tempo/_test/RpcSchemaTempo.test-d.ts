import type * as core_Address from '../../../core/Address.js'
import type * as core_MultisigConfig from '../../../tempo/MultisigConfig.js'
import type * as core_MultisigOperation from '../../../tempo/MultisigOperation.js'
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

test('multisig methods have the expected method names', () => {
  expectTypeOf<
    typeof z_RpcSchemaTempo.multisig_approveKeyAuthorization.method
  >().toEqualTypeOf<'multisig_approveKeyAuthorization'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.multisig_approveRawTransaction.method
  >().toEqualTypeOf<'multisig_approveRawTransaction'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.multisig_approveRawTransactionSync.method
  >().toEqualTypeOf<'multisig_approveRawTransactionSync'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.multisig_getConfig.method
  >().toEqualTypeOf<'multisig_getConfig'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.multisig_getOperation.method
  >().toEqualTypeOf<'multisig_getOperation'>()
})

test('multisig_getConfig has the expected request and return types', () => {
  expectTypeOf<
    z.input<typeof z_RpcSchemaTempo.multisig_getConfig.params>
  >().toEqualTypeOf<[{ address: core_Address.Address }]>()
  expectTypeOf<
    z.output<typeof z_RpcSchemaTempo.multisig_getConfig.returns>
  >().toEqualTypeOf<core_MultisigConfig.Rpc | null>()
})

test('multisig return schemas decode RPC operations', () => {
  expectTypeOf<
    z.output<typeof z_RpcSchemaTempo.multisig_approveRawTransactionSync.returns>
  >().toMatchTypeOf<core_MultisigOperation.TransactionOperation>()
  expectTypeOf<
    z.output<typeof z_RpcSchemaTempo.multisig_getOperation.returns>
  >().toMatchTypeOf<core_MultisigOperation.Operation | null>()
})

test('Multisig namespace exposes multisig methods', () => {
  expectTypeOf<
    typeof z_RpcSchemaTempo.Multisig.multisig_getConfig
  >().toEqualTypeOf<typeof z_RpcSchemaTempo.multisig_getConfig>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.Multisig.multisig_getOperation
  >().toEqualTypeOf<typeof z_RpcSchemaTempo.multisig_getOperation>()
})
