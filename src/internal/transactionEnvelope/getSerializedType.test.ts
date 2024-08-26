import { assertType, expect, test } from 'vitest'

import type { Hex } from '../types/data.js'
import type { TransactionEnvelope_Type } from '../types/transactionEnvelope.js'
import { TransactionEnvelope_getSerializedType } from './getSerializedType.js'

test('eip1559', () => {
  const type = TransactionEnvelope_getSerializedType('0x02abc')
  assertType<'eip1559'>(type)
  expect(type).toEqual('eip1559')
})

test('eip2930', () => {
  const type = TransactionEnvelope_getSerializedType('0x01abc')
  assertType<'eip2930'>(type)
  expect(type).toEqual('eip2930')
})

test('eip4844', () => {
  const type = TransactionEnvelope_getSerializedType('0x03abc')
  assertType<'eip4844'>(type)
  expect(type).toEqual('eip4844')
})

test('eip7702', () => {
  const type = TransactionEnvelope_getSerializedType('0x04abc')
  assertType<'eip7702'>(type)
  expect(type).toEqual('eip7702')
})

test('legacy', () => {
  const type = TransactionEnvelope_getSerializedType('0xc7c')
  assertType<'legacy'>(type)
  expect(type).toEqual('legacy')
})

test('unknown', () => {
  const type = TransactionEnvelope_getSerializedType('0xc7c' as Hex)
  assertType<TransactionEnvelope_Type>(type)
  expect(type).toEqual('legacy')
})

test('invalid', () => {
  expect(() =>
    TransactionEnvelope_getSerializedType('0x69abc'),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionTypeNotImplementedError: The provided transaction type `0x69` is not implemented.]',
  )
})
