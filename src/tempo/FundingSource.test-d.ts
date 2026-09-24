import { expectTypeOf, test } from 'vp/test'
import * as FundingSource from './FundingSource.js'

test('dex', () => {
  const source = FundingSource.dex({
    tokenIn: '0x0101010101010101010101010101010101010101',
  })
  expectTypeOf(
    source.to,
  ).toEqualTypeOf<'0x1120000000000000000000000000000000000001'>()
  expectTypeOf(source).toExtend<FundingSource.Source>()
})

test('encodeExecutionData', () => {
  expectTypeOf(
    FundingSource.encodeExecutionData({
      tokenIn: '0x0101010101010101010101010101010101010101',
    }),
  ).toEqualTypeOf<`0x${string}`>()
})

test('encodeConfigData', () => {
  expectTypeOf(
    FundingSource.encodeConfigData({
      tokenIn: '0x0101010101010101010101010101010101010101',
    }),
  ).toEqualTypeOf<`0x${string}`>()
})
