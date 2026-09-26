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

test('earn', () => {
  const source = FundingSource.earn({
    source: '0x0202020202020202020202020202020202020202',
    vault: '0x0101010101010101010101010101010101010101',
  })
  expectTypeOf(
    source.to,
  ).toEqualTypeOf<'0x0202020202020202020202020202020202020202'>()
  expectTypeOf(source.data).toEqualTypeOf<`0x${string}`>()
  // @ts-expect-error The deployed source address is required.
  FundingSource.earn({ vault: '0x0101010101010101010101010101010101010101' })
})
