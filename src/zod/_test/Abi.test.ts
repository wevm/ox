import { describe, expect, test } from 'vp/test'
import * as z_Abi from '../Abi.js'
import * as z_AbiConstructor from '../AbiConstructor.js'
import * as z_AbiFunction from '../AbiFunction.js'
import * as z_AbiParameter from '../AbiParameter.js'
import * as z_Solidity from '../Solidity.js'
import * as z from 'zod/mini'

describe('Abi', () => {
  test('decodes ABI items and normalizes legacy mutability fields', () => {
    const input = [
      {
        constant: true,
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
      {
        inputs: [{ name: 'owner', type: 'address' }],
        payable: true,
        type: 'constructor',
      },
      {
        payable: false,
        type: 'fallback',
      },
    ] as const

    expect(z.decode(z_Abi.Abi, input)).toMatchInlineSnapshot(`
      [
        {
          "constant": true,
          "inputs": [
            {
              "name": "owner",
              "type": "address",
            },
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "name": "balance",
              "type": "uint256",
            },
          ],
          "stateMutability": "view",
          "type": "function",
        },
        {
          "inputs": [
            {
              "name": "owner",
              "type": "address",
            },
          ],
          "payable": true,
          "stateMutability": "payable",
          "type": "constructor",
        },
        {
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "fallback",
        },
      ]
    `)
    expect(input[0]).not.toHaveProperty('stateMutability')
  })

  test('strips unknown keys', () => {
    const input: unknown = {
      type: 'function',
      inputs: [],
      name: 'totalSupply',
      outputs: [{ type: 'uint256', extra: true }],
      stateMutability: 'view',
      extra: true,
    }

    expect(z.parse(z_AbiFunction.AbiFunction, input)).toMatchInlineSnapshot(`
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "type": "uint256",
          },
        ],
        "stateMutability": "view",
        "type": "function",
      }
    `)
  })

  test('decodes tuple parameters recursively', () => {
    expect(
      z.decode(z_AbiParameter.AbiParameter, {
        name: 'foo',
        type: 'tuple[]',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'ids', type: 'uint256[]' },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "name": "owner",
            "type": "address",
          },
          {
            "name": "ids",
            "type": "uint256[]",
          },
        ],
        "name": "foo",
        "type": "tuple[]",
      }
    `)
  })

  test('rejects invalid parameter types', () => {
    expect(
      z.safeDecode(z_AbiParameter.AbiParameter, { type: 'notAValidType' })
        .success,
    ).toBe(false)
  })

  test('decodes constructors with explicit mutability', () => {
    expect(
      z.decode(z_AbiConstructor.AbiConstructor, {
        type: 'constructor',
        inputs: [],
        payable: true,
        stateMutability: 'nonpayable',
      }),
    ).toMatchInlineSnapshot(`
      {
        "inputs": [],
        "payable": true,
        "stateMutability": "nonpayable",
        "type": "constructor",
      }
    `)
  })
})

describe('Solidity', () => {
  test('decodes Solidity type tokens', () => {
    expect(z.decode(z_Solidity.Address, 'address')).toMatchInlineSnapshot(
      `"address"`,
    )
    expect(z.decode(z_Solidity.Int, 'uint256')).toMatchInlineSnapshot(
      `"uint256"`,
    )
    expect(z.decode(z_Solidity.Array, 'tuple[2][]')).toMatchInlineSnapshot(
      `"tuple[2][]"`,
    )
    expect(z.safeDecode(z_Solidity.Bytes, 'bytes33').success).toBe(false)
  })
})
