import { expectTypeOf, test } from 'vitest'
import type * as Hex from '../core/Hex.js'
import * as MultisigOperation from './MultisigOperation.js'
import type * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

declare const transaction: MultisigOperation.TransactionOperation
declare const transactionRpc: MultisigOperation.TransactionRpc
declare const keyAuthorization: MultisigOperation.KeyAuthorizationOperation
declare const keyAuthorizationRpc: MultisigOperation.KeyAuthorizationRpc
declare const operation: MultisigOperation.Operation
declare const operationRpc: MultisigOperation.Rpc
declare const getHashOptions: MultisigOperation.getHash.Options
declare const selectApprovalsOptions: MultisigOperation.selectApprovals.Options
declare const serializeTransactionOptions: MultisigOperation.serializeTransaction.Options

test('preserves operation kinds during validation', () => {
  expectTypeOf(
    MultisigOperation.from(transaction),
  ).toEqualTypeOf<MultisigOperation.TransactionOperation>()
  expectTypeOf(
    MultisigOperation.from(keyAuthorization),
  ).toEqualTypeOf<MultisigOperation.KeyAuthorizationOperation>()
  expectTypeOf(
    MultisigOperation.from(operation),
  ).toEqualTypeOf<MultisigOperation.Operation>()
})

test('preserves operation kinds during RPC conversion', () => {
  expectTypeOf(
    MultisigOperation.fromRpc(transactionRpc),
  ).toEqualTypeOf<MultisigOperation.TransactionOperation>()
  expectTypeOf(
    MultisigOperation.fromRpc(keyAuthorizationRpc),
  ).toEqualTypeOf<MultisigOperation.KeyAuthorizationOperation>()
  expectTypeOf(
    MultisigOperation.toRpc(transaction),
  ).toEqualTypeOf<MultisigOperation.TransactionRpc>()
  expectTypeOf(
    MultisigOperation.toRpc(keyAuthorization),
  ).toEqualTypeOf<MultisigOperation.KeyAuthorizationRpc>()
  expectTypeOf(
    MultisigOperation.fromRpc(operationRpc),
  ).toEqualTypeOf<MultisigOperation.Operation>()
  expectTypeOf(
    MultisigOperation.toRpc(operation),
  ).toEqualTypeOf<MultisigOperation.Rpc>()
})

test('uses JSON-RPC quantities only in RPC operations', () => {
  expectTypeOf<
    MultisigOperation.Operation['config']['version']
  >().toEqualTypeOf<bigint>()
  expectTypeOf<
    MultisigOperation.Rpc['config']['version']
  >().toEqualTypeOf<Hex.Hex>()
})

test('operation helpers return narrow types', async () => {
  expectTypeOf(
    MultisigOperation.getHash(getHashOptions),
  ).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    await MultisigOperation.selectApprovals(selectApprovalsOptions),
  ).toEqualTypeOf<MultisigOperation.selectApprovals.ReturnValue>()
  expectTypeOf(
    MultisigOperation.serializeTransaction(
      transaction,
      serializeTransactionOptions,
    ),
  ).toEqualTypeOf<TxEnvelopeTempo.Serialized>()
})
