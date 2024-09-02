import { TypedData } from 'ox'
import { test } from 'vitest'

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint32' },
  { name: 'verifyingContract', type: 'address' },
] as const

const Foo = [
  { name: 'address', type: 'address' },
  { name: 'name', type: 'string' },
  { name: 'foo', type: 'string' },
] as const

const domain = {
  name: 'Ether!',
  version: '1',
  chainId: 1,
  verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
} as const

test('type errors', () => {
  TypedData.validate({
    // @ts-expect-error address is missing
    domain: {
      ...domain,
    },
    // @ts-expect-error misspelled
    primaryType: 'Fo0',
    types: {
      EIP712Domain: [...EIP712Domain, { name: 'address', type: 'address' }],
      Foo,
    },
    message: {
      // @ts-expect-error invalid value
      address: 'xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      name: 'jxom',
      foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
    },
  })
})
