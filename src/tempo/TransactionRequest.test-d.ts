import { expectTypeOf, test } from 'vitest'
import type * as MultisigSimulation from './MultisigSimulation.js'
import type * as TransactionRequest from './TransactionRequest.js'

declare const request: TransactionRequest.TransactionRequest
declare const rpc: TransactionRequest.Rpc

test('transaction requests use domain multisig simulation specs', () => {
  expectTypeOf(request.multisigSimulation?.config.version).toEqualTypeOf<
    bigint | undefined
  >()

  const approval = request.multisigSimulation?.approvals[0]
  if (approval?.type === 'multisig')
    expectTypeOf(approval.spec.approvals[0]?.keyType).toEqualTypeOf<
      MultisigSimulation.NestedPrimitiveApproval['keyType']
    >()
})

test('RPC requests use encoded multisig configurations', () => {
  expectTypeOf(rpc.multisigSimulation?.config).toEqualTypeOf<
    `0x${string}` | undefined
  >()
})
