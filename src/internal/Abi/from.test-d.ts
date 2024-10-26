import { Abi } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('infers abi', () => {
  const abi = Abi.from(value)
  expectTypeOf(abi).toEqualTypeOf(value)
})

test('from signatures', () => {
  const abi = Abi.from([
    'function approve(address spender, uint256 amount) returns (bool)',
  ])
  expectTypeOf(abi).toEqualTypeOf(value)
})

test('not narrowable', () => {
  const abi = Abi.from({} as Abi.Abi)
  expectTypeOf(abi).toEqualTypeOf<Abi.Abi>()
})

const value = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
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
    outputs: [{ type: 'bool' }],
  },
] as const
