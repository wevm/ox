import { expect, test } from 'vitest'

import { serializeTypedData } from './serialize.js'

test('default', () => {
  expect(
    serializeTypedData({
      domain: {
        name: 'Ether!',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Foo',
      types: {
        Foo: [
          { name: 'address', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'foo', type: 'string' },
        ],
      },
      message: {
        address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        name: 'jxom',
        foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      },
    }),
  ).toMatchInlineSnapshot(
    `"{"domain":{},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9"},"primaryType":"Foo","types":{"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"`,
  )
})

test('with domain', () => {
  expect(
    serializeTypedData({
      domain: {
        name: 'Ether!',
        version: '1',
        address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Foo',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'address', type: 'address' },
          { name: 'chainId', type: 'uint32' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Foo: [
          { name: 'address', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'foo', type: 'string' },
        ],
      },
      message: {
        address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        name: 'jxom',
        foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      },
    }),
  ).toMatchInlineSnapshot(
    `"{"domain":{"name":"Ether!","version":"1","address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","chainId":1,"verifyingContract":"0xcccccccccccccccccccccccccccccccccccccccc"},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9"},"primaryType":"Foo","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"address","type":"address"},{"name":"chainId","type":"uint32"},{"name":"verifyingContract","type":"address"}],"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"`,
  )
})

test('domain as primary type', () => {
  expect(
    serializeTypedData({
      domain: {
        name: 'Ether!',
        version: '1',
        address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'EIP712Domain',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'address', type: 'address' },
          { name: 'chainId', type: 'uint32' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Foo: [
          { name: 'address', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'foo', type: 'string' },
        ],
      },
    }),
  ).toMatchInlineSnapshot(
    `"{"domain":{"name":"Ether!","version":"1","address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","chainId":1,"verifyingContract":"0xcccccccccccccccccccccccccccccccccccccccc"},"primaryType":"EIP712Domain","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"address","type":"address"},{"name":"chainId","type":"uint32"},{"name":"verifyingContract","type":"address"}],"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"`,
  )
})

test('no domain', () => {
  expect(
    serializeTypedData({
      primaryType: 'Foo',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint32' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Foo: [
          { name: 'address', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'foo', type: 'string' },
        ],
      },
      message: {
        address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        name: 'jxom',
        foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
      },
    }),
  ).toMatchInlineSnapshot(
    `"{"domain":{},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9"},"primaryType":"Foo","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint32"},{"name":"verifyingContract","type":"address"}],"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"`,
  )
})
