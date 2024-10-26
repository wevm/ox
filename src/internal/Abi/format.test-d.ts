import { Abi } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('infers abi', () => {
  const formatted = Abi.format(value)
  expectTypeOf(formatted).toEqualTypeOf([
    'function approve(address spender, uint256 amount) returns (bool)',
  ] as const)
})

test('not narrowable', () => {
  const abi = {} as Abi.Abi
  const formatted = Abi.format(abi)
  expectTypeOf(formatted).toEqualTypeOf<readonly string[]>()
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
