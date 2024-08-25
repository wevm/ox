import { expect, test } from 'vitest'
import { padRight } from '../hex/padHex.js'
import { toHex } from '../hex/toHex.js'
import { extractEip712DomainTypes } from './extractEip712DomainTypes.js'

const FULL_DOMAIN = {
  name: 'example.metamask.io',
  version: '1',
  chainId: 1,
  verifyingContract: '0x0000000000000000000000000000000000000000',
  salt: padRight(toHex(new Uint8Array([1, 2, 3]))),
} as const

test('basic', () => {
  expect(extractEip712DomainTypes(FULL_DOMAIN)).toMatchInlineSnapshot(`
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
    extractEip712DomainTypes({
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
  expect(extractEip712DomainTypes({})).toMatchInlineSnapshot('[]')
})
