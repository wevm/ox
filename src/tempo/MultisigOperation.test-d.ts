import { expectTypeOf, test } from 'vitest'
import type * as Hex from '../core/Hex.js'
import * as MultisigOperation from './MultisigOperation.js'

declare const transaction: MultisigOperation.TransactionOperation
declare const transactionRpc: MultisigOperation.TransactionRpc
declare const keyAuthorization: MultisigOperation.KeyAuthorizationOperation
declare const keyAuthorizationRpc: MultisigOperation.KeyAuthorizationRpc
declare const operation: MultisigOperation.Operation
declare const operationRpc: MultisigOperation.Rpc

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
    MultisigOperation.Operation['configVersion']
  >().toEqualTypeOf<bigint>()
  expectTypeOf<
    MultisigOperation.Rpc['configVersion']
  >().toEqualTypeOf<Hex.Hex>()
})
