import { describe, expectTypeOf, test } from 'vitest'
import type * as MultisigSimulation from './MultisigSimulation.js'
import * as TransactionRequest from './TransactionRequest.js'
import type * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

declare const request: TransactionRequest.TransactionRequest
declare const rpc: TransactionRequest.Rpc

test('transaction requests use domain multisig simulation specs', () => {
  expectTypeOf(request.multisigSimulation?.config.version).toEqualTypeOf<
    bigint | undefined
  >()

  expectTypeOf(request.multisigSimulation?.approvals[0]?.keyType).toEqualTypeOf<
    MultisigSimulation.PrimitiveApproval['keyType']
  >()
  expectTypeOf(request.keyAuthorizationSimulation).toEqualTypeOf<
    MultisigSimulation.Spec | undefined
  >()
})

test('RPC requests use encoded multisig configurations', () => {
  expectTypeOf(rpc.multisigSimulation?.config).toEqualTypeOf<
    `0x${string}` | undefined
  >()
})

describe('funding intent', () => {
  test('accepts partial unsigned requirements but keeps envelopes strict', () => {
    const partial = { sources: [] } as const
    expectTypeOf(partial).toExtend<
      Exclude<
        NonNullable<TransactionRequest.TransactionRequest['requireFunds']>,
        true
      >[number]
    >()
    expectTypeOf(partial).not.toExtend<
      NonNullable<TxEnvelopeTempo.TxEnvelopeTempo['requireFunds']>[number]
    >()
    const rpc = TransactionRequest.toRpc({
      requireFunds: [{ amount: 0n }, partial],
    })
    expectTypeOf(rpc).toEqualTypeOf<TransactionRequest.Rpc>()
    TransactionRequest.toRpc({ requireFunds: true })
    TransactionRequest.fromRpc({ requireFunds: [{ amount: '0x0' }, partial] })
    TransactionRequest.fromRpc({ requireFunds: true })
  })
})
