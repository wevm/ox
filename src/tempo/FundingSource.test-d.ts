import { expectTypeOf, test } from 'vitest'
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
