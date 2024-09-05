import { AbiError } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const exampleError = AbiError.from({
    type: 'error',
    name: 'Example',
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
  const formatted = AbiError.format(exampleError)
  expect(formatted).toMatchInlineSnapshot(
    `"error Example(address spender, uint256 amount)"`,
  )
})
