import { expectTypeOf, test } from 'vp/test'
import * as FundingRequirement from './FundingRequirement.js'
import * as FundingPolicy from './FundingPolicy.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

test('funding requirements use executable values', () => {
  expectTypeOf<
    FundingRequirement.FundingRequirement['amount']
  >().toEqualTypeOf<bigint>()
  expectTypeOf<
    FundingRequirement.FundingRequirement['slippageBps']
  >().toEqualTypeOf<number | undefined>()
  expectTypeOf<TxEnvelopeTempo.TxEnvelopeTempo['requireFunds']>().toEqualTypeOf<
    readonly FundingRequirement.FundingRequirement[] | undefined
  >()
  expectTypeOf<
    FundingRequirement.Rpc['amount']
  >().toEqualTypeOf<`0x${string}`>()
  // @ts-expect-error Inference is a relay-only operation.
  const invalid: TxEnvelopeTempo.TxEnvelopeTempo['requireFunds'] = true
  void invalid
})

test('policy authorization preserves ID and inline types', () => {
  expectTypeOf<KeyAuthorization.Input['fundingPolicy']>().toEqualTypeOf<
    FundingPolicy.Authorization | undefined
  >()
  expectTypeOf<
    FundingPolicy.Policy['rulesHash']
  >().toEqualTypeOf<`0x${string}`>()
})

test('from', () => {
  const requirement = FundingRequirement.from({
    token: '0x0101010101010101010101010101010101010101',
    amount: 50n,
    slippageBps: 0,
    sources: [
      { target: '0x0202020202020202020202020202020202020202', data: '0xab' },
    ],
  })
  expectTypeOf(requirement.amount).toEqualTypeOf<50n>()
  expectTypeOf(requirement.slippageBps).toEqualTypeOf<0>()
  expectTypeOf(requirement.sources[0].data).toEqualTypeOf<'0xab'>()
  expectTypeOf(requirement).toExtend<FundingRequirement.FundingRequirement>()
})
