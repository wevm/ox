import { AbiEvent } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const transfer = AbiEvent.from({
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256' },
    ],
  })
  const formatted = AbiEvent.format(transfer)
  expect(formatted).toMatchInlineSnapshot(
    `"event Transfer(address indexed from, address indexed to, uint256 value)"`,
  )
})
