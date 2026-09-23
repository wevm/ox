import { expectTypeOf, test } from 'vp/test'
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
