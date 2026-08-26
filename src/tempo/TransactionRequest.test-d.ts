import { expectTypeOf, test } from 'vitest'
import type * as MultisigWitness from './MultisigWitness.js'
import type * as TransactionRequest from './TransactionRequest.js'

declare const request: TransactionRequest.TransactionRequest
declare const rpc: TransactionRequest.Rpc

test('transaction requests use domain multisig witnesses', () => {
  expectTypeOf(request.multisigWitness?.config.version).toEqualTypeOf<
    bigint | undefined
  >()

  const approval = request.multisigWitness?.approvals[0]
  if (approval?.type === 'multisig')
    expectTypeOf(approval.witness.approvals[0]?.keyType).toEqualTypeOf<
      MultisigWitness.NestedPrimitiveApproval['keyType']
    >()
})

test('RPC requests use numeric multisig config versions', () => {
  expectTypeOf(rpc.multisigWitness?.config.version).toEqualTypeOf<
    number | undefined
  >()
})
