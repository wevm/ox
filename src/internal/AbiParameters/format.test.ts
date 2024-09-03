import { AbiParameters } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const parameters = AbiParameters.from([
    {
      name: 'spender',
      type: 'address',
    },
    {
      name: 'amount',
      type: 'uint256',
    },
  ])
  const formatted = AbiParameters.format(parameters)
  expect(formatted).toMatchInlineSnapshot(
    `"address spender, uint256 amount"`,
  )
})
