import { Hex, TypedData } from 'ox'
import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'

test('default', () => {
  expect(
    TypedData.encode({
      ...typedData.basic,
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"0x19012fdf3441fcaf4f30c7e16292b258a5d7054a4e2e00dbd7b7d2f467f2b8fb9413c52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e"`,
  )
})

test('complex', () => {
  expect(
    TypedData.encode({
      ...typedData.complex,
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"0x19011788ede5301fb0c4b95dda42eabe811ba83dc3cde96087b00c9b72a4d26a379ac2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
  )
})

test('no domain', () => {
  expect(
    TypedData.encode({
      ...typedData.complex,
      domain: undefined,
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"0x19016192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1c2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
  )
  expect(
    TypedData.encode({
      ...typedData.complex,
      domain: {},
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"0x19016192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1c2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
  )
})

test('domain: empty name', () => {
  expect(
    TypedData.encode({
      ...typedData.complex,
      domain: { name: '' },
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"0x190196d6b4b58ef5c06dfaf375adc42ff615f90c055921386f4140a4c91caa786a91c2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
  )
})

test('minimal valid typed message', () => {
  const encoded = TypedData.encode({
    types: {
      EIP712Domain: [],
    },
    primaryType: 'EIP712Domain',
    domain: {},
  })

  expect(encoded).toMatchInlineSnapshot(
    `"0x19016192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1"`,
  )
})

test('typed message with a domain separator that uses all fields.', () => {
  const encoded = TypedData.encode({
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
        {
          name: 'salt',
          type: 'bytes32',
        },
      ],
    },
    primaryType: 'EIP712Domain',
    domain: {
      name: 'example.metamask.io',
      version: '1',
      chainId: 1n,
      verifyingContract: '0x0000000000000000000000000000000000000000',
      salt: Hex.padRight(Hex.from(new Uint8Array([1, 2, 3]))),
    },
  })

  expect(encoded).toMatchInlineSnapshot(
    `"0x190162d1d3234124be639f11bfcb3c421b50cc645b88e2aca76f3a6ddf860a94e5b1"`,
  )
})

test('typed message with only custom domain separator fields', () => {
  const encoded = TypedData.encode({
    types: {
      EIP712Domain: [
        {
          name: 'customName',
          type: 'string',
        },
        {
          name: 'customVersion',
          type: 'string',
        },
        {
          name: 'customChainId',
          type: 'uint256',
        },
        {
          name: 'customVerifyingContract',
          type: 'address',
        },
        {
          name: 'customSalt',
          type: 'bytes32',
        },
        {
          name: 'extraField',
          type: 'string',
        },
      ],
    },
    primaryType: 'EIP712Domain',
    domain: {
      customName: 'example.metamask.io',
      customVersion: '1',
      customChainId: 1n,
      customVerifyingContract: '0x0000000000000000000000000000000000000000',
      customSalt: Hex.padRight(Hex.from(new Uint8Array([1, 2, 3]))),
      extraField: 'stuff',
    },
  })

  expect(encoded).toMatchInlineSnapshot(
    `"0x1901e4e2a795578f2e89fbd7a0b67e17df4b7791a6c47054b423ea27f1076f56bd4a"`,
  )
})

test('typed message with data', () => {
  const encoded = TypedData.encode({
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
        {
          name: 'salt',
          type: 'bytes32',
        },
      ],
      Message: [{ name: 'data', type: 'string' }],
    },
    primaryType: 'Message',
    domain: {
      name: 'example.metamask.io',
      version: '1',
      chainId: 1n,
      verifyingContract: '0x0000000000000000000000000000000000000000',
      salt: Hex.padRight(Hex.from(new Uint8Array([1, 2, 3]))),
    },
    message: {
      data: 'Hello!',
    },
  })

  expect(encoded).toMatchInlineSnapshot(
    `"0x190162d1d3234124be639f11bfcb3c421b50cc645b88e2aca76f3a6ddf860a94e5b115d2c54cdaa22a6a3a8dbd89086b2ffcf0853857db9bcf1541765a8f769a63ba"`,
  )
})
