import type { TransactionEnvelope } from 'ox'
import { expectTypeOf, test } from 'vitest'
import { TransactionEnvelope_getType } from './getType.js'

test('empty', () => {
  expectTypeOf(TransactionEnvelope_getType({})).toEqualTypeOf<string>()
})

test('opaque', () => {
  expectTypeOf(
    TransactionEnvelope_getType({} as TransactionEnvelope.TransactionEnvelope),
  ).toEqualTypeOf<'legacy' | 'eip1559' | 'eip2930' | 'eip4844' | 'eip7702'>()
  expectTypeOf(
    TransactionEnvelope_getType({} as TransactionEnvelope.Legacy),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    TransactionEnvelope_getType({} as TransactionEnvelope.Eip1559),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    TransactionEnvelope_getType({} as TransactionEnvelope.Eip2930),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    TransactionEnvelope_getType({} as TransactionEnvelope.Eip4844),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({} as TransactionEnvelope.Eip7702),
  ).toEqualTypeOf<'eip7702'>()
})

test('const: type', () => {
  expectTypeOf(
    TransactionEnvelope_getType({ type: 'legacy' }),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    TransactionEnvelope_getType({ type: 'eip1559' }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    TransactionEnvelope_getType({ type: 'eip2930' }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    TransactionEnvelope_getType({ type: 'eip4844' }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({ type: 'eip7702' }),
  ).toEqualTypeOf<'eip7702'>()
})

test('const: legacy attributes', () => {
  expectTypeOf(
    TransactionEnvelope_getType({ gasPrice: 1n }),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    TransactionEnvelope_getType({ gasPrice: 1n, maxFeePerGas: undefined }),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    TransactionEnvelope_getType({ gasPrice: 1n, maxFeePerBlobGas: undefined }),
  ).toEqualTypeOf<'legacy'>()
})

test('const: eip1559 attributes', () => {
  expectTypeOf(
    TransactionEnvelope_getType({ maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    TransactionEnvelope_getType({ maxPriorityFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    TransactionEnvelope_getType({ maxFeePerGas: 1n, maxPriorityFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    TransactionEnvelope_getType({ maxFeePerGas: 1n, gasPrice: undefined }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    TransactionEnvelope_getType({ accessList: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
})

test('const: eip2930 attributes', () => {
  expectTypeOf(
    TransactionEnvelope_getType({
      accessList: [
        {
          address: '0x',
          storageKeys: ['0x'],
        },
      ],
    }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    TransactionEnvelope_getType({ accessList: [] }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    TransactionEnvelope_getType({ accessList: [], maxFeePerGas: undefined }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    TransactionEnvelope_getType({ accessList: [], gasPrice: undefined }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    TransactionEnvelope_getType({ accessList: [], gasPrice: 1n }),
  ).toEqualTypeOf<'eip2930'>()
})

test('const: 4844 attributes', () => {
  expectTypeOf(
    TransactionEnvelope_getType({ blobVersionedHashes: [] }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({
      blobVersionedHashes: [],
      gasPrice: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({
      blobVersionedHashes: [],
      maxFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({ blobVersionedHashes: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({
      blobVersionedHashes: [],
      maxPriorityFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({
      blobVersionedHashes: [],
      maxPriorityFeePerGas: 1n,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({ sidecars: [] }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    TransactionEnvelope_getType({ blobVersionedHashes: [] }),
  ).toEqualTypeOf<'eip4844'>()
})

test('const: 7702 attributes', () => {
  expectTypeOf(
    TransactionEnvelope_getType({ authorizationList: [] }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    TransactionEnvelope_getType({ authorizationList: [], gasPrice: undefined }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    TransactionEnvelope_getType({
      authorizationList: [],
      maxFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    TransactionEnvelope_getType({ authorizationList: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    TransactionEnvelope_getType({
      authorizationList: [],
      maxPriorityFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    TransactionEnvelope_getType({
      authorizationList: [],
      maxPriorityFeePerGas: 1n,
    }),
  ).toEqualTypeOf<'eip7702'>()
})

test('unknown type', () => {
  expectTypeOf(
    TransactionEnvelope_getType({ type: '0x05' }),
  ).toEqualTypeOf<'0x05'>()
})
