import { Abi } from 'ox'
import { describe, expect, test } from 'vitest'

describe('format', () => {
  test('default', () => {
    const abi = Abi.from([
      {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint256',
          },
        ],
        outputs: [{ type: 'bool' }],
      },
    ])
    const formatted = Abi.format(abi)
    expect(formatted).toMatchInlineSnapshot(`
    [
      "function approve(address spender, uint256 amount) returns (bool)",
    ]
  `)
  })
})

describe('from', () => {
  test('default', () => {
    {
      const abi = Abi.from([
        {
          type: 'function',
          name: 'approve',
          stateMutability: 'nonpayable',
          inputs: [
            {
              name: 'spender',
              type: 'address',
            },
            {
              name: 'amount',
              type: 'uint256',
            },
          ],
          outputs: [{ type: 'bool' }],
        },
      ])
      expect(abi).toMatchInlineSnapshot(`
      [
        {
          "inputs": [
            {
              "name": "spender",
              "type": "address",
            },
            {
              "name": "amount",
              "type": "uint256",
            },
          ],
          "name": "approve",
          "outputs": [
            {
              "type": "bool",
            },
          ],
          "stateMutability": "nonpayable",
          "type": "function",
        },
      ]
    `)
    }

    {
      const abi = Abi.from([
        'function approve(address spender, uint256 amount) returns (bool)',
      ])
      expect(abi).toMatchInlineSnapshot(`
      [
        {
          "inputs": [
            {
              "name": "spender",
              "type": "address",
            },
            {
              "name": "amount",
              "type": "uint256",
            },
          ],
          "name": "approve",
          "outputs": [
            {
              "type": "bool",
            },
          ],
          "stateMutability": "nonpayable",
          "type": "function",
        },
      ]
    `)
    }
  })
})

test('exports', () => {
  expect(Object.keys(Abi)).toMatchInlineSnapshot(`
    [
      "format",
      "from",
    ]
  `)
})
