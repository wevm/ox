import { expectTypeOf, test } from 'vitest'
import type * as AccountSimulation from './AccountSimulation.js'
import type * as TransactionRequest from './TransactionRequest.js'

declare const request: TransactionRequest.TransactionRequest
declare const rpc: TransactionRequest.Rpc

test('transaction requests use domain account simulation specs', () => {
  expectTypeOf(request.accountSimulation?.config.version).toEqualTypeOf<
    bigint | undefined
  >()

  expectTypeOf(request.accountSimulation?.approvals[0]?.keyType).toEqualTypeOf<
    AccountSimulation.PrimitiveApproval['keyType']
  >()
  expectTypeOf(request.keyAuthorizationSimulation).toEqualTypeOf<
    AccountSimulation.Spec | undefined
  >()
})

test('RPC requests use encoded account configurations', () => {
  expectTypeOf(rpc.multisigSimulation?.config).toEqualTypeOf<
    `0x${string}` | undefined
  >()
})

test('maps the configurable key type to the RPC multisig key type', () => {
  expectTypeOf(request.keyType).toEqualTypeOf<
    'configurable' | 'p256' | 'secp256k1' | 'webAuthn' | undefined
  >()
  expectTypeOf(rpc.keyType).toEqualTypeOf<
    'multisig' | 'p256' | 'secp256k1' | 'webAuthn' | undefined
  >()
})
