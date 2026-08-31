import type { Provider } from 'ox'
import type {
  KeyAuthorization,
  MultisigConfig,
  MultisigOperation,
  MultisigSimulation,
  RpcSchemaTempo,
} from 'ox/tempo'
import { expectTypeOf, test } from 'vitest'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

declare const provider: Provider.Provider<{ schema: RpcSchemaTempo.Multisig }>
declare const tempoProvider: Provider.Provider<{
  schema: RpcSchemaTempo.Tempo
}>
declare const address: Address.Address
declare const hash: Hex.Hex
declare const keyAuthorization: KeyAuthorization.Rpc
declare const multisigSimulation: MultisigSimulation.Rpc
declare const serializedTransaction: Hex.Hex
declare const signature: Hex.Hex

test('multisig provider methods', () => {
  expectTypeOf(
    provider.request({
      method: 'multisig_approveRawTransaction',
      params: [serializedTransaction],
    }),
  ).resolves.toEqualTypeOf<Hex.Hex>()

  expectTypeOf(
    provider.request({
      method: 'multisig_approveRawTransactionSync',
      params: [serializedTransaction],
    }),
  ).resolves.toEqualTypeOf<MultisigOperation.TransactionRpc>()

  provider.request({
    method: 'multisig_approveRawTransactionSync',
    params: [serializedTransaction, 30_000],
  })

  expectTypeOf(
    provider.request({
      method: 'multisig_approveKeyAuthorization',
      params: [{ keyAuthorization }],
    }),
  ).resolves.toEqualTypeOf<MultisigOperation.KeyAuthorizationRpc>()

  expectTypeOf(
    provider.request({
      method: 'multisig_approveKeyAuthorization',
      params: [{ hash, signature }],
    }),
  ).resolves.toEqualTypeOf<MultisigOperation.KeyAuthorizationRpc>()

  expectTypeOf(
    provider.request({
      method: 'multisig_getConfig',
      params: [{ address }],
    }),
  ).resolves.toEqualTypeOf<MultisigConfig.Rpc | null>()

  expectTypeOf(
    provider.request({
      method: 'multisig_getOperation',
      params: [hash],
    }),
  ).resolves.toEqualTypeOf<MultisigOperation.Rpc | null>()
})

test('tempo simulation accepts multisig specs', () => {
  tempoProvider.request({
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
