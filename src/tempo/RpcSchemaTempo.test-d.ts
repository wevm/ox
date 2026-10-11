import type { Provider } from 'ox'
import type {
  AccountConfig,
  AccountSimulation,
  KeyAuthorization,
  AccountOperation,
  RpcSchemaTempo,
} from 'ox/tempo'
import { expectTypeOf, test } from 'vp/test'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

declare const provider: Provider.Provider<{ schema: RpcSchemaTempo.Account }>
declare const tempoProvider: Provider.Provider<{
  schema: RpcSchemaTempo.Tempo
}>
declare const address: Address.Address
declare const hash: Hex.Hex
declare const keyAuthorization: KeyAuthorization.Rpc
declare const multisigSimulation: AccountSimulation.Rpc
declare const serializedTransaction: Hex.Hex
declare const signature: Hex.Hex

test('account provider methods', () => {
  expectTypeOf(
    provider.request({
      method: 'account_approveKeyAuthorization',
      params: [{ keyAuthorization }],
    }),
  ).resolves.toEqualTypeOf<AccountOperation.KeyAuthorizationRpc>()

  expectTypeOf(
    provider.request({
      method: 'account_approveKeyAuthorization',
      params: [{ hash, signature }],
    }),
  ).resolves.toEqualTypeOf<AccountOperation.KeyAuthorizationRpc>()

  expectTypeOf(
    provider.request({
      method: 'account_approveRawTransaction',
      params: [serializedTransaction],
    }),
  ).resolves.toEqualTypeOf<Hex.Hex>()

  expectTypeOf(
    provider.request({
      method: 'account_approveRawTransactionSync',
      params: [serializedTransaction],
    }),
  ).resolves.toEqualTypeOf<AccountOperation.TransactionRpc>()

  void provider.request({
    method: 'account_approveRawTransactionSync',
    params: [serializedTransaction, 30_000],
  })

  expectTypeOf(
    provider.request({
      method: 'account_getConfig',
      params: [{ address }],
    }),
  ).resolves.toEqualTypeOf<AccountConfig.Rpc | null>()

  expectTypeOf(
    provider.request({
      method: 'account_getOperation',
      params: [hash],
    }),
  ).resolves.toEqualTypeOf<AccountOperation.Rpc | null>()
})

test('tempo simulation accepts account simulation specs', () => {
  void tempoProvider.request({
    method: 'tempo_simulateV1',
    params: [
      {
        blockStateCalls: [
          {
            calls: [
              {
                multisigSimulation,
              },
            ],
          },
        ],
      },
      'latest',
    ],
  })
})
