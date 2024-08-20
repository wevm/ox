import { test } from 'vitest'

import { serializeTypedData } from './serialize.js'

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

test('default', () => {
  serializeTypedData({
    domain,
    primaryType: 'Foo',
    types: {
      Foo,
    },
    message: {
      address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      name: 'jxom',
      foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
    },
  })
})

test('with domain', () => {
  serializeTypedData({
    domain: {
      ...domain,
      address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
    },
    primaryType: 'Foo',
    types: {
      EIP712Domain: [...EIP712Domain, { name: 'address', type: 'address' }],
      Foo,
    },
    message: {
      address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      name: 'jxom',
      foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
    },
  })
})

test('with domain as primary type', () => {
  serializeTypedData({
    domain: {
      ...domain,
      address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
    },
    primaryType: 'EIP712Domain',
    types: {
      EIP712Domain: [...EIP712Domain, { name: 'address', type: 'address' }],
      Foo,
    },
  })
})

test('no domain', () => {
  serializeTypedData({
    primaryType: 'Foo',
    types: {
      EIP712Domain,
      Foo,
    },
    message: {
      address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      name: 'jxom',
      foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
    },
  })
})

test('type errors', () => {
  serializeTypedData({
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
