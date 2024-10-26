import { Abi } from 'ox'
import { expect, expectTypeOf, test } from 'vitest'

test('default', () => {
  const abi = Abi.from([
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
  ])
  const formatted = Abi.format(abi)
  expect(formatted).toMatchInlineSnapshot(`
    [
      "function approve(address spender, uint256 amount) returns (bool)",
    ]
  `)
  expectTypeOf(formatted).toEqualTypeOf([
    'function approve(address spender, uint256 amount) returns (bool)',
  ] as const)
})
