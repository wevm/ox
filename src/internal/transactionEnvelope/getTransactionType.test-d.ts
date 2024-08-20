import { expectTypeOf, test } from 'vitest'
import type { TransactionEnvelope } from 'ox'
import { getTransactionType } from './getTransactionType.js'

test('empty', () => {
  expectTypeOf(getTransactionType({})).toEqualTypeOf<string>()
})

test('opaque', () => {
  expectTypeOf(
    getTransactionType({} as TransactionEnvelope.TransactionEnvelope),
  ).toEqualTypeOf<'legacy' | 'eip1559' | 'eip2930' | 'eip4844' | 'eip7702'>()
  expectTypeOf(
    getTransactionType({} as TransactionEnvelope.Legacy),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    getTransactionType({} as TransactionEnvelope.Eip1559),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getTransactionType({} as TransactionEnvelope.Eip2930),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getTransactionType({} as TransactionEnvelope.Eip4844),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({} as TransactionEnvelope.Eip7702),
  ).toEqualTypeOf<'eip7702'>()
})

test('const: type', () => {
  expectTypeOf(getTransactionType({ type: 'legacy' })).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    getTransactionType({ type: 'eip1559' }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getTransactionType({ type: 'eip2930' }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getTransactionType({ type: 'eip4844' }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({ type: 'eip7702' }),
  ).toEqualTypeOf<'eip7702'>()
})

test('const: legacy attributes', () => {
  expectTypeOf(getTransactionType({ gasPrice: 1n })).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    getTransactionType({ gasPrice: 1n, maxFeePerGas: undefined }),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    getTransactionType({ gasPrice: 1n, maxFeePerBlobGas: undefined }),
  ).toEqualTypeOf<'legacy'>()
})

test('const: eip1559 attributes', () => {
  expectTypeOf(
    getTransactionType({ maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getTransactionType({ maxPriorityFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getTransactionType({ maxFeePerGas: 1n, maxPriorityFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getTransactionType({ maxFeePerGas: 1n, gasPrice: undefined }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getTransactionType({ accessList: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
})

test('const: eip2930 attributes', () => {
  expectTypeOf(
    getTransactionType({
      accessList: [
        {
          address: '0x',
          storageKeys: ['0x'],
        },
      ],
    }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getTransactionType({ accessList: [] }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getTransactionType({ accessList: [], maxFeePerGas: undefined }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getTransactionType({ accessList: [], gasPrice: undefined }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getTransactionType({ accessList: [], gasPrice: 1n }),
  ).toEqualTypeOf<'eip2930'>()
})

test('const: 4844 attributes', () => {
  expectTypeOf(
    getTransactionType({ blobVersionedHashes: [] }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({
      blobVersionedHashes: [],
      gasPrice: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({
      blobVersionedHashes: [],
      maxFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({ blobVersionedHashes: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({
      blobVersionedHashes: [],
      maxPriorityFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({
      blobVersionedHashes: [],
      maxPriorityFeePerGas: 1n,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(getTransactionType({ sidecars: [] })).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getTransactionType({ blobVersionedHashes: [] }),
  ).toEqualTypeOf<'eip4844'>()
})

test('const: 7702 attributes', () => {
  expectTypeOf(
    getTransactionType({ authorizationList: [] }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getTransactionType({ authorizationList: [], gasPrice: undefined }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getTransactionType({
      authorizationList: [],
      maxFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getTransactionType({ authorizationList: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getTransactionType({
      authorizationList: [],
      maxPriorityFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getTransactionType({
      authorizationList: [],
      maxPriorityFeePerGas: 1n,
    }),
  ).toEqualTypeOf<'eip7702'>()
})

test('unknown type', () => {
  expectTypeOf(getTransactionType({ type: '0x05' })).toEqualTypeOf<'0x05'>()
})
