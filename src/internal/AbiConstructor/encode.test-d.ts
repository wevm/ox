import { AbiConstructor, type Address } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('no inputs', () => {
  const abiConstructor = AbiConstructor.from('constructor()')
  AbiConstructor.encode(abiConstructor, options)
})

test('infers args type', () => {
  const abiConstructor = AbiConstructor.from('constructor(address, uint256)')
  AbiConstructor.encode(abiConstructor, {
    ...options,
    args: ['0x', 123n],
  })
  expectTypeOf(AbiConstructor.encode<typeof abiConstructor>)
    .parameter(1)
    .toHaveProperty('args')
    .toMatchTypeOf<readonly [Address.Address, bigint]>()
})

test('not narrowable', () => {
  const abiConstructor = {} as AbiConstructor.AbiConstructor
  AbiConstructor.encode(abiConstructor, options)
})

const options = {
  bytecode: '0x',
} as const
