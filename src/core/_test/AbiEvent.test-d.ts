import { Abi, AbiEvent } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

describe('decode', () => {
  test('behavior: event', () => {
    const transfer = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )
    const decoded = AbiEvent.decode(transfer, {
      topics: [
        AbiEvent.getSelector(transfer),
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    })

    expectTypeOf(decoded).toEqualTypeOf<{
      from: `0x${string}`
      to: `0x${string}`
      value: bigint
    }>()
  })

  test('behavior: with overloads, zero-input and named', () => {
    const abi = Abi.from(['event Foo()', 'event Foo(address indexed who)'])
    const log = { topics: [] } as const

    expectTypeOf(AbiEvent.decode(abi, 'Foo', log)).toEqualTypeOf<
      { who: `0x${string}` } | undefined
    >()
    expectTypeOf(
      AbiEvent.decode(AbiEvent.fromAbi(abi, 'Foo'), log),
    ).toEqualTypeOf<{ who: `0x${string}` } | undefined>()
  })

  test('behavior: with overloads, anonymous and named', () => {
    const abi = Abi.from([
      { anonymous: true, inputs: [], name: 'Foo', type: 'event' },
      {
        inputs: [{ indexed: true, name: 'who', type: 'address' }],
        name: 'Foo',
        type: 'event',
      },
    ])
    const decoded = AbiEvent.decode(abi, 'Foo', { topics: [] })

    expectTypeOf(decoded).toEqualTypeOf<{ who: `0x${string}` } | undefined>()
  })

  test('behavior: with overloads, two named', () => {
    const abi = Abi.from([
      'event Deposit(address indexed who, uint256 amount)',
      'event Deposit(address indexed who, uint256 amount, bytes32 indexed ref)',
    ])
    const decoded = AbiEvent.decode(abi, 'Deposit', { topics: [] })

    expectTypeOf(decoded).toEqualTypeOf<
      | { amount: bigint; who: `0x${string}` }
      | { amount: bigint; ref: `0x${string}`; who: `0x${string}` }
    >()
  })

  test('not narrowable', () => {
    const abiEvent = {} as AbiEvent.AbiEvent
    const decoded = AbiEvent.decode(abiEvent, { topics: [] })

    expectTypeOf(decoded).toEqualTypeOf<unknown>()
  })
})
