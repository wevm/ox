import { erc20Abi } from 'abitype/abis'
import { type Abi, AbiConstructor } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

const error = {} as AbiConstructor.encode.ErrorType
error.name

describe('AbiConstructor.decode', () => {
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
})

describe('AbiConstructor.encode', () => {
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
    // @ts-expect-error invalid types
    AbiConstructor.encode(abiConstructor, {
      ...options,
      args: ['x', 123],
    })
  })

  test('no args', () => {
    const abiConstructor = AbiConstructor.from('constructor()')
    AbiConstructor.encode(abiConstructor, {
      ...options,
      args: [],
    })
  })

  test('not narrowable', () => {
    const abiConstructor = {} as AbiConstructor.AbiConstructor
    AbiConstructor.encode(abiConstructor, options)
  })
})

const options = {
  bytecode: '0x',
  data: '0x',
} as const

describe('AbiConstructor.format', () => {
  test('infers abi constructor', () => {
    const formatted = AbiConstructor.format(value)
    expectTypeOf(formatted).toEqualTypeOf(
      'constructor(address spender, uint256 amount) payable' as const,
    )
  })

  test('not narrowable', () => {
    const abiConstructor = {} as AbiConstructor.AbiConstructor
    const formatted = AbiConstructor.format(abiConstructor)
    expectTypeOf(formatted).toEqualTypeOf<string>()
  })
})

describe('AbiConstructor.from', () => {
  test('infers abi', () => {
    const abiConstructor = AbiConstructor.from(value)
    expectTypeOf(abiConstructor).toEqualTypeOf(value)
  })

  test('from signatures', () => {
    const abiConstructor = AbiConstructor.from(
      'constructor(address spender, uint256 amount) payable',
    )
    expectTypeOf(abiConstructor).toEqualTypeOf(value)
  })

  test('not narrowable', () => {
    const abiConstructor = AbiConstructor.from(
      {} as AbiConstructor.AbiConstructor,
    )
    expectTypeOf(abiConstructor).toEqualTypeOf<AbiConstructor.AbiConstructor>()
  })
})

const value = {
  type: 'constructor',
  stateMutability: 'payable',
  inputs: [
    {
      name: 'spender',
      type: 'address',
    },
    {
      name: 'amount',
      type: 'uint256',
    },
  ],
} as const

describe('AbiConstructor.fromAbi', () => {
  test('infers abi', () => {
    const abiConstructor = AbiConstructor.fromAbi([...erc20Abi, value])
    expectTypeOf(abiConstructor).toEqualTypeOf(value)
  })

  test('not narrowable', () => {
    const abiConstructor = AbiConstructor.fromAbi({} as Abi.Abi)
    expectTypeOf(abiConstructor).toEqualTypeOf<AbiConstructor.AbiConstructor>()
  })
})
