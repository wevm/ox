import { AbiParameter } from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

describe('AbiParameter.format', () => {
  test('infers parameter', () => {
    const formatted = AbiParameter.format(value)
    expectTypeOf(formatted).toEqualTypeOf<'address spender'>()
  })

  test('not narrowable', () => {
    const formatted = AbiParameter.format({} as AbiParameter.AbiParameter)
    expectTypeOf(formatted).toEqualTypeOf<string>()
  })

  const value = {
    name: 'spender',
    type: 'address',
  } as const
})

describe('AbiParameter.from', () => {
  test('infers parameter', () => {
    const parameter = AbiParameter.from(value)
    expectTypeOf(parameter).toEqualTypeOf(value)
  })

  test('from signature', () => {
    const parameter = AbiParameter.from('address spender')
    expectTypeOf(parameter).toEqualTypeOf(value)
  })

  test('not narrowable', () => {
    const parameter = AbiParameter.from({} as AbiParameter.AbiParameter)
    expectTypeOf(parameter).toEqualTypeOf<AbiParameter.AbiParameter>()
  })

  const value = {
    name: 'spender',
    type: 'address',
  } as const
})
