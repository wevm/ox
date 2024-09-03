import { AbiItem } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const abiItem = AbiItem.from({
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
  const formatted = AbiItem.format(abiItem)
  expect(formatted).toMatchInlineSnapshot(
    `"function approve(address spender, uint256 amount) returns (bool)"`,
  )
})
