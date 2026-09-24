import { expectTypeOf, test } from 'vitest'
import * as FundingSourceEarn from './FundingSourceEarn.js'

const vault = '0x0101010101010101010101010101010101010101' as const

test('encodeExecutionData', () => {
  expectTypeOf(
    FundingSourceEarn.encodeExecutionData({ vault }),
  ).toEqualTypeOf<`0x${string}`>()
  // @ts-expect-error Input caps use bigint base units.
  FundingSourceEarn.encodeExecutionData({ maxAmountIn: 30, vault })
})

test('encodeConfigData', () => {
  expectTypeOf(
    FundingSourceEarn.encodeConfigData({ maxValueIn: 50n, vault }),
  ).toEqualTypeOf<`0x${string}`>()
  // @ts-expect-error A vault is required.
  FundingSourceEarn.encodeConfigData({ maxValueIn: 50n })
})

test('decode', () => {
  expectTypeOf(FundingSourceEarn.decode('0x')).toEqualTypeOf<
    Required<FundingSourceEarn.Request>
  >()
})
