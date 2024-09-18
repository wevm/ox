import { Hex, TypedData } from 'ox'
import { expect, test } from 'vitest'

const FULL_DOMAIN = {
  name: 'example.metamask.io',
  version: '1',
  chainId: 1,
  verifyingContract: '0x0000000000000000000000000000000000000000',
  salt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
} as const

test('basic', () => {
  expect(
    TypedData.extractEip712DomainTypes(FULL_DOMAIN),
  ).toMatchInlineSnapshot(`
    [
      {
        "name": "name",
        "type": "string",
      },
      {
        "name": "version",
        "type": "string",
      },
      {
        "name": "chainId",
        "type": "uint256",
      },
      {
        "name": "verifyingContract",
        "type": "address",
      },
      {
        "name": "salt",
        "type": "bytes32",
      },
    ]
  `)
})

test('partial', () => {
  expect(
    TypedData.extractEip712DomainTypes({
      ...FULL_DOMAIN,
      name: undefined,
      version: undefined,
    }),
  ).toMatchInlineSnapshot(`
    [
      {
        "name": "chainId",
        "type": "uint256",
      },
      {
        "name": "verifyingContract",
        "type": "address",
      },
      {
        "name": "salt",
        "type": "bytes32",
      },
    ]
  `)
})

test('empty', () => {
  expect(TypedData.extractEip712DomainTypes({})).toMatchInlineSnapshot('[]')
})
