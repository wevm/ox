import { expect, test } from 'vitest'
import { padRight } from '../data/pad.js'
import { toHex } from '../hex/toHex.js'
import { getTypesForEip712Domain } from './getTypesForEip712Domain.js'

const FULL_DOMAIN = {
  name: 'example.metamask.io',
  version: '1',
  chainId: 1,
  verifyingContract: '0x0000000000000000000000000000000000000000',
  salt: padRight(toHex(new Uint8Array([1, 2, 3]))),
} as const

test('basic', () => {
  expect(getTypesForEip712Domain(FULL_DOMAIN)).toMatchInlineSnapshot(`
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
    getTypesForEip712Domain({
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
  expect(getTypesForEip712Domain({})).toMatchInlineSnapshot('[]')
})
