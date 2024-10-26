import { AbiConstructor } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('no inputs', () => {
  const abiConstructor = AbiConstructor.from('constructor()')
  const decoded = AbiConstructor.decode(abiConstructor, options)
  expectTypeOf(decoded).toEqualTypeOf(undefined)
})

test('infers decoded types', () => {
  const abiConstructor = AbiConstructor.from('constructor(address, uint256)')
  const decoded = AbiConstructor.decode(abiConstructor, options)
  expectTypeOf(decoded).toEqualTypeOf<readonly [`0x${string}`, bigint]>()
})

test('not narrowable', () => {
  const abiConstructor = {} as AbiConstructor.AbiConstructor
  const decoded = AbiConstructor.decode(abiConstructor, options)
  expectTypeOf(decoded).toEqualTypeOf<readonly unknown[] | undefined>()
})

const options = {
  bytecode: '0x',
  data: '0x',
} as const
