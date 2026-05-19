import { Abi, AbiError } from 'ox'
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

describe('AbiError.encode', () => {
  test('default', () => {
    const error = AbiError.from('error Example()')
    AbiError.encode(error)
  })

  test('behavior: with args', () => {
    const error = AbiError.from('error Example(uint256)')
    AbiError.encode(error, [69420n])
    // @ts-expect-error invalid args
    AbiError.encode(error)
    // @ts-expect-error invalid args
    AbiError.encode(error, [])
    // @ts-expect-error invalid args
    AbiError.encode(error, [69420])
    // @ts-expect-error invalid args
    AbiError.encode(error, [69420n, 123n])
  })

  test('behavior: no hash', () => {
    const error = AbiError.from('error Example()')
    AbiError.encode({ ...error, hash: undefined })
  })
})

describe('AbiError.extract', () => {
  test('behavior: multiple args', () => {
    const abi = Abi.from(['error Example(uint r, uint s, uint8 yParity)'])
    const extracted = AbiError.extract(abi, '0x')

    expectTypeOf(extracted.error.name).toEqualTypeOf<
      'Example' | 'Error' | 'Panic'
    >()
    expectTypeOf(extracted.args).toEqualTypeOf<
      | readonly [bigint, bigint, number]
      | readonly [message: string]
      | readonly [reason: number]
    >()
  })

  test('behavior: error name discriminates args', () => {
    const abi = Abi.from(['error Example(uint r, uint s, uint8 yParity)'])
    const extracted = AbiError.extract(abi, '0x')

    type Extracted = typeof extracted

    expectTypeOf<
      Extract<Extracted, { error: { name: 'Example' } }>['args']
    >().toEqualTypeOf<readonly [bigint, bigint, number]>()
    expectTypeOf<
      Extract<Extracted, { error: { name: 'Error' } }>['args']
    >().toEqualTypeOf<readonly [message: string]>()
    expectTypeOf<
      Extract<Extracted, { error: { name: 'Panic' } }>['args']
    >().toEqualTypeOf<readonly [reason: number]>()
  })

  test('behavior: as = Object', () => {
    const abi = Abi.from(['error Example(uint r, uint s, uint8 yParity)'])
    const extracted = AbiError.extract(abi, '0x', { as: 'Object' })

    expectTypeOf(extracted.args).toEqualTypeOf<
      | {
          r: bigint
          s: bigint
          yParity: number
        }
      | { message: string }
      | { reason: number }
    >()
  })

  test('behavior: single arg does not collapse args', () => {
    const abi = Abi.from(['error Example(uint8 yParity)'])
    const extracted = AbiError.extract(abi, '0x')

    expectTypeOf(extracted.args).toEqualTypeOf<
      readonly [number] | readonly [message: string] | readonly [reason: number]
    >()
  })
})
