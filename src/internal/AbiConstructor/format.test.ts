import { AbiConstructor } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const approve = AbiConstructor.from({
    inputs: [{ name: 'owner', type: 'address' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  })
  const formatted = AbiConstructor.format(approve)
  expect(formatted).toMatchInlineSnapshot(`"constructor(address owner)"`)
})
