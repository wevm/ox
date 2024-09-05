import { AbiFunction } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const approve = AbiFunction.from({
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
  })
  const formatted = AbiFunction.format(approve)
  expect(formatted).toMatchInlineSnapshot(
    `"function approve(address spender, uint256 amount) returns (bool)"`,
  )
})
