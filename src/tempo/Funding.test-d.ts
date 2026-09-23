import { expectTypeOf, test } from 'vp/test'
import * as Funding from './Funding.js'
import * as FundingPolicy from './FundingPolicy.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

test('funding requirements use executable values', () => {
  expectTypeOf<Funding.Requirement['amount']>().toEqualTypeOf<bigint>()
  expectTypeOf<Funding.Requirement['slippageBps']>().toEqualTypeOf<
    number | undefined
  >()
  expectTypeOf<TxEnvelopeTempo.TxEnvelopeTempo['requireFunds']>().toEqualTypeOf<
    readonly Funding.Requirement[] | undefined
  >()
  expectTypeOf<Funding.Rpc['amount']>().toEqualTypeOf<`0x${string}`>()
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
