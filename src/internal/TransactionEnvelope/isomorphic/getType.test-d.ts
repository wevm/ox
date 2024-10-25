import type {
  TransactionEnvelope,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip7702,
  TransactionEnvelopeLegacy,
} from 'ox'
import { expectTypeOf, test } from 'vitest'
import { getType } from './getType.js'

test('empty', () => {
  expectTypeOf(getType({})).toEqualTypeOf<string>()
})

test('opaque', () => {
  expectTypeOf(
    getType({} as TransactionEnvelope.TransactionEnvelope),
  ).toEqualTypeOf<'legacy' | 'eip1559' | 'eip2930' | 'eip4844' | 'eip7702'>()
  expectTypeOf(
    getType({} as TransactionEnvelopeLegacy.TransactionEnvelope),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    getType({} as TransactionEnvelopeEip1559.TransactionEnvelope),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getType({} as TransactionEnvelopeEip2930.TransactionEnvelope),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getType({} as TransactionEnvelopeEip4844.TransactionEnvelope),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getType({} as TransactionEnvelopeEip7702.TransactionEnvelope),
  ).toEqualTypeOf<'eip7702'>()
})

test('const: type', () => {
  expectTypeOf(getType({ type: 'legacy' })).toEqualTypeOf<'legacy'>()
  expectTypeOf(getType({ type: 'eip1559' })).toEqualTypeOf<'eip1559'>()
  expectTypeOf(getType({ type: 'eip2930' })).toEqualTypeOf<'eip2930'>()
  expectTypeOf(getType({ type: 'eip4844' })).toEqualTypeOf<'eip4844'>()
  expectTypeOf(getType({ type: 'eip7702' })).toEqualTypeOf<'eip7702'>()
})

test('const: legacy attributes', () => {
  expectTypeOf(getType({ gasPrice: 1n })).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    getType({ gasPrice: 1n, maxFeePerGas: undefined }),
  ).toEqualTypeOf<'legacy'>()
  expectTypeOf(
    getType({ gasPrice: 1n, maxFeePerBlobGas: undefined }),
  ).toEqualTypeOf<'legacy'>()
})

test('const: eip1559 attributes', () => {
  expectTypeOf(getType({ maxFeePerGas: 1n })).toEqualTypeOf<'eip1559'>()
  expectTypeOf(getType({ maxPriorityFeePerGas: 1n })).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getType({ maxFeePerGas: 1n, maxPriorityFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getType({ maxFeePerGas: 1n, gasPrice: undefined }),
  ).toEqualTypeOf<'eip1559'>()
  expectTypeOf(
    getType({ accessList: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip1559'>()
})

test('const: eip2930 attributes', () => {
  expectTypeOf(
    getType({
      accessList: [
        {
          address: '0x',
          storageKeys: ['0x'],
        },
      ],
    }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(getType({ accessList: [] })).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getType({ accessList: [], maxFeePerGas: undefined }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getType({ accessList: [], gasPrice: undefined }),
  ).toEqualTypeOf<'eip2930'>()
  expectTypeOf(
    getType({ accessList: [], gasPrice: 1n }),
  ).toEqualTypeOf<'eip2930'>()
})

test('const: 4844 attributes', () => {
  expectTypeOf(getType({ blobVersionedHashes: [] })).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getType({
      blobVersionedHashes: [],
      gasPrice: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getType({
      blobVersionedHashes: [],
      maxFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getType({ blobVersionedHashes: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getType({
      blobVersionedHashes: [],
      maxPriorityFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(
    getType({
      blobVersionedHashes: [],
      maxPriorityFeePerGas: 1n,
    }),
  ).toEqualTypeOf<'eip4844'>()
  expectTypeOf(getType({ sidecars: [] })).toEqualTypeOf<'eip4844'>()
  expectTypeOf(getType({ blobVersionedHashes: [] })).toEqualTypeOf<'eip4844'>()
})

test('const: 7702 attributes', () => {
  expectTypeOf(getType({ authorizationList: [] })).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getType({ authorizationList: [], gasPrice: undefined }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getType({
      authorizationList: [],
      maxFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getType({ authorizationList: [], maxFeePerGas: 1n }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getType({
      authorizationList: [],
      maxPriorityFeePerGas: undefined,
    }),
  ).toEqualTypeOf<'eip7702'>()
  expectTypeOf(
    getType({
      authorizationList: [],
      maxPriorityFeePerGas: 1n,
    }),
  ).toEqualTypeOf<'eip7702'>()
})

test('unknown type', () => {
  expectTypeOf(getType({ type: '0x05' })).toEqualTypeOf<'0x05'>()
})
