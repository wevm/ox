import { AbiError } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

describe('AbiError.decode', () => {
  test('behavior: no args', () => {
    const error = AbiError.from('error InvalidSignature()')
    const decoded = AbiError.decode(error, '0x')
    expectTypeOf(decoded).toEqualTypeOf<undefined>()
  })

  test('behavior: single arg', () => {
    const error = AbiError.from('error InvalidSignature(uint8 yParity)')
    const decoded = AbiError.decode(error, '0x')
    expectTypeOf(decoded).toEqualTypeOf<number>()
  })

  test('behavior: multiple args', () => {
    const error = AbiError.from('error Example(uint r, uint s, uint8 yParity)')
    const decoded = AbiError.decode(error, '0x')
    expectTypeOf(decoded).toEqualTypeOf<readonly [bigint, bigint, number]>()
  })

  test('behavior: as = Object', () => {
    const error = AbiError.from('error Example(uint r, uint s, uint8 yParity)')
    const decoded = AbiError.decode(error, '0x', { as: 'Object' })
    expectTypeOf(decoded).toEqualTypeOf<{
      r: bigint
      s: bigint
      yParity: number
    }>()
  })

  test('behavior: as = Object, single arg', () => {
    const error = AbiError.from('error Example(uint8 yParity)')
    const decoded = AbiError.decode(error, '0x', { as: 'Object' })
    expectTypeOf(decoded).toEqualTypeOf<number>()
  })

  test('not narrowable', () => {
    const abiError = {} as AbiError.AbiError
    const decoded = AbiError.decode(abiError, '0x')
    expectTypeOf(decoded).toEqualTypeOf<
      unknown | readonly unknown[] | undefined
    >()
  })
})
