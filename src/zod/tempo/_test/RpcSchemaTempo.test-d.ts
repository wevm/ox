import type * as core_Address from '../../../core/Address.js'
import type * as core_AccountConfig from '../../../tempo/AccountConfig.js'
import type * as core_AccountOperation from '../../../tempo/AccountOperation.js'
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

test('account methods have the expected method names', () => {
  expectTypeOf<
    typeof z_RpcSchemaTempo.account_approveKeyAuthorization.method
  >().toEqualTypeOf<'account_approveKeyAuthorization'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.account_approveRawTransaction.method
  >().toEqualTypeOf<'account_approveRawTransaction'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.account_approveRawTransactionSync.method
  >().toEqualTypeOf<'account_approveRawTransactionSync'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.account_getConfig.method
  >().toEqualTypeOf<'account_getConfig'>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.account_getOperation.method
  >().toEqualTypeOf<'account_getOperation'>()
})

test('account_getConfig has the expected request and return types', () => {
  expectTypeOf<
    z.input<typeof z_RpcSchemaTempo.account_getConfig.params>
  >().toEqualTypeOf<[{ address: core_Address.Address }]>()
  expectTypeOf<
    z.output<typeof z_RpcSchemaTempo.account_getConfig.returns>
  >().toEqualTypeOf<core_AccountConfig.Rpc | null>()
})

test('account return schemas decode RPC operations', () => {
  expectTypeOf<
    z.output<typeof z_RpcSchemaTempo.account_approveRawTransactionSync.returns>
  >().toMatchTypeOf<core_AccountOperation.TransactionOperation>()
  expectTypeOf<
    z.output<typeof z_RpcSchemaTempo.account_getOperation.returns>
  >().toMatchTypeOf<core_AccountOperation.Operation | null>()
})

test('Account namespace exposes account methods', () => {
  expectTypeOf<
    typeof z_RpcSchemaTempo.Account.account_getConfig
  >().toEqualTypeOf<typeof z_RpcSchemaTempo.account_getConfig>()
  expectTypeOf<
    typeof z_RpcSchemaTempo.Account.account_getOperation
  >().toEqualTypeOf<typeof z_RpcSchemaTempo.account_getOperation>()
})
