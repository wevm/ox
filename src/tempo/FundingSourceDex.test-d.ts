import { expectTypeOf, test } from 'vitest'
import type * as FundingSource from './FundingSource.js'
import * as FundingSourceDex from './FundingSourceDex.js'

test('from', () => {
  const source = FundingSourceDex.from({
    tokenIn: '0x0101010101010101010101010101010101010101',
  })
  expectTypeOf(
    source.to,
  ).toEqualTypeOf<'0x1120000000000000000000000000000000000001'>()
  expectTypeOf(source).toExtend<FundingSource.Source>()
})

test('encodeExecutionData', () => {
  expectTypeOf(
    FundingSourceDex.encodeExecutionData({
      tokenIn: '0x0101010101010101010101010101010101010101',
    }),
  ).toEqualTypeOf<`0x${string}`>()
})

test('encodeConfigData', () => {
  expectTypeOf(
    FundingSourceDex.encodeConfigData({
      tokenIn: '0x0101010101010101010101010101010101010101',
    }),
  ).toEqualTypeOf<`0x${string}`>()
})

test('decodeConfigData', () => {
  expectTypeOf(FundingSourceDex.decodeConfigData('0x')).toEqualTypeOf<
    Required<FundingSourceDex.Request>
  >()
})

test('decodeExecutionData', () => {
  expectTypeOf(FundingSourceDex.decodeExecutionData('0x')).toEqualTypeOf<
    Required<FundingSourceDex.Request>
  >()
})
