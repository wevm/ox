import { expectTypeOf, test } from 'vp/test'
import type * as Hex from '../core/Hex.js'
import * as AccountOperation from './AccountOperation.js'
import type * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

declare const transaction: AccountOperation.TransactionOperation
declare const transactionRpc: AccountOperation.TransactionRpc
declare const keyAuthorization: AccountOperation.KeyAuthorizationOperation
declare const keyAuthorizationRpc: AccountOperation.KeyAuthorizationRpc
declare const operation: AccountOperation.Operation
declare const operationRpc: AccountOperation.Rpc
declare const getHashOptions: AccountOperation.getHash.Options
declare const selectApprovalsOptions: AccountOperation.selectApprovals.Options
declare const serializedKeyAuthorization: Hex.Hex
declare const serializeKeyAuthorizationOptions: AccountOperation.serializeKeyAuthorization.Options
declare const serializeTransactionOptions: AccountOperation.serializeTransaction.Options

test('preserves operation kinds during validation', () => {
  expectTypeOf(
    AccountOperation.from(transaction),
  ).toEqualTypeOf<AccountOperation.TransactionOperation>()
  expectTypeOf(
    AccountOperation.from(keyAuthorization),
  ).toEqualTypeOf<AccountOperation.KeyAuthorizationOperation>()
  expectTypeOf(
    AccountOperation.from(operation),
  ).toEqualTypeOf<AccountOperation.Operation>()
})

test('preserves operation kinds during RPC conversion', () => {
  expectTypeOf(
    AccountOperation.fromRpc(transactionRpc),
  ).toEqualTypeOf<AccountOperation.TransactionOperation>()
  expectTypeOf(
    AccountOperation.fromRpc(keyAuthorizationRpc),
  ).toEqualTypeOf<AccountOperation.KeyAuthorizationOperation>()
  expectTypeOf(
    AccountOperation.toRpc(transaction),
  ).toEqualTypeOf<AccountOperation.TransactionRpc>()
  expectTypeOf(
    AccountOperation.toRpc(keyAuthorization),
  ).toEqualTypeOf<AccountOperation.KeyAuthorizationRpc>()
  expectTypeOf(
    AccountOperation.fromRpc(operationRpc),
  ).toEqualTypeOf<AccountOperation.Operation>()
  expectTypeOf(
    AccountOperation.toRpc(operation),
  ).toEqualTypeOf<AccountOperation.Rpc>()
})

test('uses JSON-RPC quantities only in RPC operations', () => {
  expectTypeOf<
    AccountOperation.Operation['config']['version']
  >().toEqualTypeOf<bigint>()
  expectTypeOf<
    AccountOperation.Rpc['config']['version']
  >().toEqualTypeOf<Hex.Hex>()
})

test('operation helpers return narrow types', async () => {
  expectTypeOf(
    AccountOperation.getHash(getHashOptions),
  ).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    await AccountOperation.selectApprovals(selectApprovalsOptions),
  ).toEqualTypeOf<AccountOperation.selectApprovals.ReturnValue>()
  expectTypeOf(
    AccountOperation.serializeKeyAuthorization(
      serializedKeyAuthorization,
      serializeKeyAuthorizationOptions,
    ),
  ).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    AccountOperation.serializeTransaction(
      transaction,
      serializeTransactionOptions,
    ),
  ).toEqualTypeOf<TxEnvelopeTempo.Serialized>()
})
